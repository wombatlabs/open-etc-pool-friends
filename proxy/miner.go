package proxy

import (
	"log"
	"math/big"
	"strconv"
	"strings"

	"github.com/yuriy0803/core-geth1/common"
	"github.com/yuriy0803/etchash"
	"github.com/yuriy0803/open-etc-pool-friends/util"
)

var (
	maxUint256                             = new(big.Int).Exp(big.NewInt(2), big.NewInt(256), big.NewInt(0))
	ecip1099FBlockClassic uint64           = 11700000 // classic mainnet
	ecip1099FBlockMordor  uint64           = 2520000  // mordor
	uip1FEpoch            uint64           = 22       // ubiq mainnet
	xip5Block             uint64           = 0        // expanse rebirth network
	hasher                *etchash.Etchash = nil
)

func (s *ProxyServer) processShare(login, id, ip string, t *BlockTemplate, params []string, stratum bool) (bool, bool) {

	if hasher == nil {
		if s.config.Network == "expanse" || s.config.Network == "rebirth" {
			hasher = etchash.New(nil, nil, &xip5Block)
		} else if s.config.Network == "classic" {
			hasher = etchash.New(&ecip1099FBlockClassic, nil, nil)
		} else if s.config.Network == "mordor" {
			hasher = etchash.New(&ecip1099FBlockMordor, nil, nil)
		} else if s.config.Network == "ubiq" {
			hasher = etchash.New(nil, &uip1FEpoch, nil)
		} else if s.config.Network == "ethereum" || s.config.Network == "ropsten" || s.config.Network == "ethereumPow" ||
			s.config.Network == "ethereumFair" || s.config.Network == "callisto" || s.config.Network == "etica" ||
			s.config.Network == "octaspace" || s.config.Network == "universal" || s.config.Network == "canxium" || 
			s.config.Network == "qie" || s.config.Network == "maga" {
			hasher = etchash.New(nil, nil, nil)
		} else {
			// unknown network
			log.Printf("Unknown network configuration %s", s.config.Network)
			return false, false
		}
	}

	nonceHex := params[0]
	hashNoNonce := params[1]
	mixDigest := params[2]
	nonce, _ := strconv.ParseUint(strings.Replace(nonceHex, "0x", "", -1), 16, 64)
	shareDiff := s.config.Proxy.Difficulty
	stratumHostname := s.config.Proxy.StratumHostname

	var result common.Hash
	if stratum {
		hashNoNonceTmp := common.HexToHash(params[2])

		mixDigestTmp, hashTmp := hasher.Compute(t.Height, hashNoNonceTmp, nonce)
		params[1] = hashNoNonceTmp.Hex()
		params[2] = mixDigestTmp.Hex()
		hashNoNonce = params[1]
		result = hashTmp
	} else {
		hashNoNonceTmp := common.HexToHash(hashNoNonce)
		mixDigestTmp, hashTmp := hasher.Compute(t.Height, hashNoNonceTmp, nonce)

		// check mixDigest
		if mixDigestTmp.Hex() != mixDigest {
			return false, false
		}
		result = hashTmp
	}

	//this is to stop people in wallet blacklist, from getting shares into the db.
	//rare instances of hacks require letting the hacks waste thier money on occassion
	if !s.policy.ApplyLoginWalletPolicy(login) {
		// check to see if this wallet login is blocked
		log.Printf("Blacklisted wallet share, skipped from %v", login)
		return false, false
		//return codes need work here, a lot of it.
	}

	// Block "difficulty" is BigInt
	// NiceHash "difficulty" is float64 ...
	// diffFloat => target; then: diffInt = 2^256 / target
	shareDiffCalc := util.TargetHexToDiff(result.Hex()).Int64()
	shareDiffFloat := util.DiffIntToFloat(shareDiffCalc)
	if shareDiffFloat < 0.0001 {
		log.Printf("share difficulty too low, %f < %d, from %v@%v", shareDiffFloat, t.Difficulty, login, ip)
		s.backend.WriteWorkerShareStatus(login, id, false, true, false)
		return false, false
	}

	if s.config.Proxy.Debug {
		hashrateShareDiff := formatHashrate(shareDiffCalc)
		hashrateBlockDiff := formatHashrate(t.Difficulty.Int64()) // Konvertieren zu int64
		hashrateShare := formatHashrate(shareDiff)

		// Ausgabe der formatierten Informationen in der Kommandozeile (cmd)
		log.Printf("Mining Information:")
		log.Printf("Blockchain Height: %d", t.Height) // Geändert zu "Blockchain Height"
		log.Printf("Pool Difficulty: %d (%s)", shareDiff, hashrateShare)
		log.Printf("Block Difficulty: %d (%s)", t.Difficulty.Int64(), hashrateBlockDiff)
		log.Printf("Share Difficulty: %d (%s)", shareDiffCalc, hashrateShareDiff)
		log.Printf("Submitted by: %v@%v", login, ip)
	}

	h, ok := t.headers[hashNoNonce]
	if !ok {
		log.Printf("Stale share from %v@%v", login, ip)
		return false, false
	}
	//Write the Ip address into the settings:login:ipaddr and timeit added to settings:login:iptime hash
	s.backend.LogIP(login, ip)

	// check share difficulty
	shareTarget := new(big.Int).Div(maxUint256, big.NewInt(shareDiff))
	if result.Big().Cmp(shareTarget) > 0 {
		s.backend.WriteWorkerShareStatus(login, id, false, false, true)
		return false, false
	}
	// check target difficulty
	target := new(big.Int).Div(maxUint256, big.NewInt(h.diff.Int64()))
	if result.Big().Cmp(target) <= 0 {
		ok, err := s.rpc().SubmitBlock(params)
		if err != nil {
			log.Printf("Block submission failure at height %v for %v: %v", h.height, t.Header, err)
		} else if !ok {
			log.Printf("Block rejected at height %v for %v", h.height, t.Header)
			return false, false
		} else {
			s.fetchBlockTemplate()
			exist, err := s.backend.WriteBlock(login, id, params, shareDiff, shareDiffCalc, h.diff.Int64(), h.height, s.hashrateExpiration, stratumHostname)
			if exist {
				return true, false
			}
			if err != nil {
				log.Println("Failed to insert block candidate into backend:", err)
			} else {
				log.Printf("Inserted block %v to backend", h.height)
			}
			log.Printf("Block found by miner %v@%v at height %d", login, ip, h.height)
		}
	} else {
		exist, err := s.backend.WriteShare(login, id, params, shareDiff, shareDiffCalc, h.height, s.hashrateExpiration, stratumHostname)
		if exist {
			return true, false
		}
		if err != nil {
			log.Println("Failed to insert share data into backend:", err)
		}
	}
	s.backend.WriteWorkerShareStatus(login, id, true, false, false)
	return false, true
}

func formatHashrate(shareDiffCalc int64) string {
	units := []string{"H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s"}
	var i int
	diff := float64(shareDiffCalc)

	for i = 0; i < len(units)-1 && diff >= 1000.0; i++ {
		diff /= 1000.0
	}

	formatted := strconv.FormatFloat(diff, 'f', 2, 64)
	return formatted + " " + units[i]
}
