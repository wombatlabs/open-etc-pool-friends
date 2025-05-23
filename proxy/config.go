package proxy

import (
	"github.com/yuriy0803/open-etc-pool-friends/api"
	"github.com/yuriy0803/open-etc-pool-friends/exchange"
	"github.com/yuriy0803/open-etc-pool-friends/payouts"
	"github.com/yuriy0803/open-etc-pool-friends/policy"
	"github.com/yuriy0803/open-etc-pool-friends/storage"
)

type Config struct {
	Name                  string        `json:"name"`
	Proxy                 Proxy         `json:"proxy"`
	Api                   api.ApiConfig `json:"api"`
	Upstream              []Upstream    `json:"upstream"`
	UpstreamCheckInterval string        `json:"upstreamCheckInterval"`

	Threads int `json:"threads"`

	Coin     string         `json:"coin"`
	CoinSolo string         `json:"coin-solo"`
	Pplns    int64          `json:"pplns"`
	CoinName string         `json:"coin-name"`
	Network  string         `json:"network"`
	Algo     string         `json:"algo"`
	Redis    storage.Config `json:"redis"`

	BlockUnlocker payouts.UnlockerConfig `json:"unlocker"`
	Payouts       payouts.PayoutsConfig  `json:"payouts"`

	Exchange exchange.ExchangeConfig `json:"exchange"`

	NewrelicName    string `json:"newrelicName"`
	NewrelicKey     string `json:"newrelicKey"`
	NewrelicVerbose bool   `json:"newrelicVerbose"`
	NewrelicEnabled bool   `json:"newrelicEnabled"`
}

type Proxy struct {
	Enabled              bool   `json:"enabled"`
	Listen               string `json:"listen"`
	LimitHeadersSize     int    `json:"limitHeadersSize"`
	LimitBodySize        int64  `json:"limitBodySize"`
	BehindReverseProxy   bool   `json:"behindReverseProxy"`
	BlockRefreshInterval string `json:"blockRefreshInterval"`
	Difficulty           int64  `json:"difficulty"`
	StateUpdateInterval  string `json:"stateUpdateInterval"`
	HashrateExpiration   string `json:"hashrateExpiration"`
	StratumHostname      string `json:"stratumHostname"`

	Policy policy.Config `json:"policy"`

	MaxFails    int64 `json:"maxFails"`
	HealthCheck bool  `json:"healthCheck"`
	Debug       bool  `json:"debug"`

	Stratum Stratum `json:"stratum"`
	VarDiff VarDiff `json:"varDiff"`
}

type Stratum struct {
	Enabled  bool   `json:"enabled"`
	Listen   string `json:"listen"`
	Timeout  string `json:"timeout"`
	MaxConn  int    `json:"maxConn"`
	TLS      bool   `json:"tls"`
	CertFile string `json:"certFile"`
	KeyFile  string `json:"keyFile"`
}

type VarDiff struct {
	MinDiff         int64   `json:"minDiff"`
	MaxDiff         int64   `json:"maxDiff"`
	TargetTime      float64 `json:"targetTime"`
	VariancePercent int     `json:"variancePercent"`
	MaxJump         int64   `json:"maxJump"`
}

type Upstream struct {
	Name    string `json:"name"`
	Url     string `json:"url"`
	Timeout string `json:"timeout"`
}
