'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface LabGroupStatus {
  institution: string | null
  department: string | null
  peerCount: number          // 같은 기관·학과의 인증 연구자 수
  threshold: number          // 그룹 형성 임계치
  joined: boolean            // 이미 그룹에 속해 있는지
  isLeader: boolean
  group: null | {
    id: string
    name: string
    code: string | null
    memberCount: number
  }
}

const LAB_THRESHOLD = 5

/** 본인(연구자)의 랩 그룹 상태 조회 */
export async function getLabGroupStatus(): Promise<LabGroupStatus | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const [{ data: peersRes }, { data: profile }] = await Promise.all([
    db.rpc('count_lab_peers', { p_user_id: user.id }),
    db.from('researcher_profiles').select('lab_group_id, institution, department').eq('user_id', user.id).maybeSingle(),
  ])

  const peers = peersRes as { institution: string | null; department: string | null; count: number } | null
  let group: LabGroupStatus['group'] = null
  let isLeader = false
  if (profile?.lab_group_id) {
    const { data: lab } = await db
      .from('lab_groups')
      .select('id, name, code, member_count, leader_id')
      .eq('id', profile.lab_group_id)
      .maybeSingle()
    if (lab) {
      group = { id: lab.id, name: lab.name, code: lab.code, memberCount: lab.member_count }
      isLeader = lab.leader_id === user.id
    }
  }

  return {
    institution: peers?.institution ?? profile?.institution ?? null,
    department: peers?.department ?? profile?.department ?? null,
    peerCount: peers?.count ?? 0,
    threshold: LAB_THRESHOLD,
    joined: !!group,
    isLeader,
    group,
  }
}

/** 연구자가 자신의 기관·학과 랩 그룹을 생성(또는 참여) */
export async function claimLabGroup(name: string): Promise<
  { ok: true; labId: string; code: string; count: number } | { ok: false; reason: string; count?: number }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthorized' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('claim_lab_group', { p_leader_id: user.id, p_name: name })
  if (error) return { ok: false, reason: error.message }
  if (!data?.ok) return { ok: false, reason: data?.reason ?? 'unknown', count: data?.count }
  return { ok: true, labId: data.lab_id, code: data.code, count: data.count }
}
