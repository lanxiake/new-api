package service

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/require"
)

// 项目未引入 miniredis，本测试只覆盖 Redis 不可用时的 fail-open 路径
// 以及本地内存集合行为。Redis 路径靠生产灰度 + 端到端测试覆盖。

func TestRecordFailure_RedisDisabled_ReturnsFalse(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()

	got := RecordFailure(42, 429)
	require.False(t, got, "Redis 不可用时应返回 false")
}

func TestRecordFailure_NonRetryableCode_ReturnsFalse(t *testing.T) {
	// 401 不在默认 RetryableStatusCodes 内
	got := RecordFailure(42, 401)
	require.False(t, got)
}

func TestIsInCooldown_DefaultFalse(t *testing.T) {
	cooldownLocalSet.Delete(99)
	require.False(t, IsInCooldown(99))
}

func TestClearCooldown_RemovesFromLocalSet(t *testing.T) {
	cooldownLocalSet.Store(7, true)
	require.True(t, IsInCooldown(7))
	ClearCooldown(7)
	require.False(t, IsInCooldown(7))
}

func TestRecordSuccess_RedisDisabled_NoPanic(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()

	require.NotPanics(t, func() {
		RecordSuccess(42)
	})
}

func TestSyncCooldownFromRedis_RedisDisabled_NoPanic(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()

	require.NotPanics(t, func() {
		SyncCooldownFromRedis()
	})
}

func TestAcquireProbeLock_RedisDisabled_ReturnsTrue(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()

	require.True(t, acquireProbeLock(42), "无 Redis 时允许探活（单实例语义）")
}

func TestRegisterProbeChannelImpl_NoImpl_NoPanic(t *testing.T) {
	saved := probeChannelImpl
	probeChannelImpl = nil
	defer func() { probeChannelImpl = saved }()

	require.NotPanics(t, func() {
		probeChannelSafely(42)
	})
}
