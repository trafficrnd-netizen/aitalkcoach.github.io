/**
 * 기기 매칭 서비스
 *
 * - 한 계정당 모바일 1대 + PC 1대까지 등록 가능 (지금은 모바일만 운영, PC 슬롯은 예약)
 * - 새 기기에서 로그인하면 기존 기기를 교체할지 물어봄
 * - AsyncStorage에 (accountId → deviceId) 매핑 저장
 * - 백엔드 없는 로컬 저장 (실제 OAuth 연동 시 서버 검증으로 교체)
 *
 * 기기 ID: 설치 시 1회 생성, 영구 보존. 디바이스 모델명/플랫폼은 native module로.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 키: accountId → { mobile: deviceId, pc: deviceId|null }
// 값 예시:
//   { 'test-001': { mobile: 'dev-abc123', pc: null },
//     'admin-001': { mobile: 'dev-xyz789', pc: null } }
const KEY_DEVICE_MAP = 'aitalkcoach:device-map';

// 키: deviceId → deviceMeta (이름, 플랫폼, 등록일)
//   { 'dev-abc123': { name: 'Galaxy S24', platform: 'android', registeredAt: 1700000000000 } }
const KEY_DEVICE_REGISTRY = 'aitalkcoach:device-registry';

// 현재 기기 ID (앱 설치 시 1회 생성, 이후 영구)
const KEY_CURRENT_DEVICE = 'aitalkcoach:current-device';

let cachedDeviceId = null;

/**
 * 랜덤 device ID 생성
 */
function generateDeviceId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `dev-${ts}-${rnd}`;
}

/**
 * 현재 기기 ID 조회. 없으면 생성.
 */
export async function getOrCreateDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await AsyncStorage.getItem(KEY_CURRENT_DEVICE);
    if (!id) {
      id = generateDeviceId();
      await AsyncStorage.setItem(KEY_CURRENT_DEVICE, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (e) {
    // fallback to in-memory
    if (!cachedDeviceId) cachedDeviceId = generateDeviceId();
    return cachedDeviceId;
  }
}

/**
 * 현재 기기의 표시 이름 (UI용)
 * - Android: Settings.Global.DEVICE_NAME (Android 10+) 또는 모델명 fallback
 * - iOS: device.name (별칭)
 */
export function getDeviceName() {
  if (Platform.OS === 'android') {
    // Android 10+ 에서는 DEVICE_NAME 권한이 있지만, 호환성 위해 모델명 사용
    return `Android (${Platform.Version})`;
  }
  if (Platform.OS === 'ios') {
    return `iOS (${Platform.Version})`;
  }
  if (Platform.OS === 'web') {
    return 'PC (웹)';
  }
  return `${Platform.OS} 기기`;
}

export function getDevicePlatform() {
  if (Platform.OS === 'web') return 'pc';
  return 'mobile';
}

/**
 * 디바이스 메타 정보 저장 (이름/플랫폼/등록일)
 */
export async function registerCurrentDeviceMeta() {
  const id = await getOrCreateDeviceId();
  const registry = await getDeviceRegistry();
  registry[id] = {
    name: getDeviceName(),
    platform: getDevicePlatform(),
    registeredAt: Date.now(),
  };
  await AsyncStorage.setItem(KEY_DEVICE_REGISTRY, JSON.stringify(registry));
  return registry[id];
}

export async function getDeviceRegistry() {
  try {
    const raw = await AsyncStorage.getItem(KEY_DEVICE_REGISTRY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * 계정 → 기기 매핑 조회
 */
export async function getAccountDeviceMap() {
  try {
    const raw = await AsyncStorage.getItem(KEY_DEVICE_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setAccountDeviceMap(map) {
  await AsyncStorage.setItem(KEY_DEVICE_MAP, JSON.stringify(map));
}

/**
 * 특정 계정의 등록된 기기 (모바일/PC 슬롯)
 * @returns { mobile: deviceMeta|null, pc: deviceMeta|null, currentIsMobile: bool, currentIsPc: bool }
 */
export async function getAccountDevices(accountId) {
  if (!accountId) return { mobile: null, pc: null };
  const map = await getAccountDeviceMap();
  const slots = map[accountId] || { mobile: null, pc: null };
  const registry = await getDeviceRegistry();
  const currentId = await getOrCreateDeviceId();

  const mobileMeta = slots.mobile ? registry[slots.mobile] : null;
  const pcMeta = slots.pc ? registry[slots.pc] : null;

  return {
    mobile: mobileMeta ? { id: slots.mobile, ...mobileMeta } : null,
    pc: pcMeta ? { id: slots.pc, ...pcMeta } : null,
    currentDeviceId: currentId,
    currentIsMobile: slots.mobile === currentId,
    currentIsPc: slots.pc === currentId,
  };
}

/**
 * 계정에 기기 등록/교체. 슬롯에 자리가 비었으면 등록, 차있으면 교체.
 * @returns { { action: 'registered' | 'replaced-mobile' | 'replaced-pc' | 'replaced', previousDevice: {id, name, platform} | null } }
 */
export async function registerDeviceForAccount(accountId) {
  if (!accountId) throw new Error('accountId 필요');
  const currentId = await getOrCreateDeviceId();
  const currentPlatform = getDevicePlatform();
  const map = await getAccountDeviceMap();
  const slots = map[accountId] || { mobile: null, pc: null };
  const registry = await getDeviceRegistry();
  await registerCurrentDeviceMeta();

  // 이미 등록된 기기면 변경 없음
  if (slots[currentPlatform] === currentId) {
    return { action: 'registered', previousDevice: null, currentDeviceId: currentId };
  }

  let previousDevice = null;
  let action = 'registered';
  const slotKey = currentPlatform === 'pc' ? 'pc' : 'mobile';

  if (slots[slotKey]) {
    // 슬롯 차있음 → 교체
    const oldId = slots[slotKey];
    const oldMeta = registry[oldId];
    previousDevice = oldId ? { id: oldId, ...(oldMeta || {}) } : null;
    action = slotKey === 'pc' ? 'replaced-pc' : 'replaced-mobile';
  }

  slots[slotKey] = currentId;
  map[accountId] = slots;
  await setAccountDeviceMap(map);

  return { action, previousDevice, currentDeviceId: currentId, currentPlatform };
}

/**
 * 기기 교체 (확인된 경우 호출)
 *  - 새 기기 ID + 교체할 슬롯
 *  - 이전 기기 ID는 'unregistered' 상태로 만들어서 알림용으로 보관할 수도 있지만
 *    본 서비스에서는 그냥 슬롯에서 제거.
 */
export async function replaceDevice(accountId, slot /* 'mobile' | 'pc' */) {
  if (!accountId || !slot) throw new Error('accountId, slot 필요');
  const currentId = await getOrCreateDeviceId();
  const map = await getAccountDeviceMap();
  const slots = map[accountId] || { mobile: null, pc: null };
  const previousId = slots[slot] || null;

  slots[slot] = currentId;
  map[accountId] = slots;
  await setAccountDeviceMap(map);
  await registerCurrentDeviceMeta();

  return { previousDeviceId: previousId, newDeviceId: currentId };
}

/**
 * 로그아웃 시 호출: 현재 기기가 등록된 슬롯이면 비우기.
 * (단, 데이터는 남겨두므로 다시 로그인하면 다시 잡힘)
 */
export async function clearCurrentDeviceFromAccount(accountId) {
  if (!accountId) return;
  const currentId = await getOrCreateDeviceId();
  const map = await getAccountDeviceMap();
  const slots = map[accountId];
  if (!slots) return;
  if (slots.mobile === currentId) slots.mobile = null;
  if (slots.pc === currentId) slots.pc = null;
  if (!slots.mobile && !slots.pc) {
    delete map[accountId];
  } else {
    map[accountId] = slots;
  }
  await setAccountDeviceMap(map);
}
