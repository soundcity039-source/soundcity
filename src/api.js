import { supabase } from './lib/supabase.js'

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function getMembers(filters = {}) {
  let query = supabase.from('members').select('*')
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active)
  else if (!filters.all) query = query.eq('is_active', true)
  if (filters.member_id) query = query.eq('member_id', filters.member_id)
  const { data, error } = await query.order('full_name')
  if (error) throw error
  return data || []
}

export async function registerMember(payload) {
  const { data: { user } } = await supabase.auth.getUser()
  const row = {
    user_id: user.id,
    full_name: payload.full_name,
    grade: payload.grade || null,
    gender: payload.gender || null,
    main_part: Array.isArray(payload.main_part)
      ? payload.main_part.join(',') : (payload.main_part || null),
    photo_url: payload.photo_url || null,
    fav_bands: payload.fav_bands || null,
    want_parts: Array.isArray(payload.want_parts)
      ? payload.want_parts.join(',') : (payload.want_parts || null),
  }
  const { data, error } = await supabase.from('members').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateProfile(payload) {
  const row = {
    full_name: payload.full_name,
    grade: payload.grade || null,
    gender: payload.gender || null,
    main_part: Array.isArray(payload.main_part)
      ? payload.main_part.join(',') : (payload.main_part || null),
    photo_url: payload.photo_url || null,
    fav_bands: payload.fav_bands || null,
    want_parts: Array.isArray(payload.want_parts)
      ? payload.want_parts.join(',') : (payload.want_parts || null),
  }
  const { data, error } = await supabase
    .from('members').update(row).eq('member_id', payload.member_id).select().single()
  if (error) throw error
  return data
}

export async function updateMember(payload) {
  const fields = {}
  if (payload.is_active !== undefined) fields.is_active = payload.is_active
  if (payload.is_admin !== undefined) fields.is_admin = payload.is_admin
  if (payload.role !== undefined) fields.role = payload.role
  const { data, error } = await supabase
    .from('members').update(fields).eq('member_id', payload.member_id).select().single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------
export async function getLives(filters = {}) {
  let query = supabase.from('lives').select('*')
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query.order('date1', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLive(payload) {
  const { data, error } = await supabase.from('lives').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateLive(payload) {
  const { live_id, ...fields } = payload
  const { data, error } = await supabase
    .from('lives').update(fields).eq('live_id', live_id).select().single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export async function getPlans(filters = {}) {
  let query = supabase.from('plans').select(`
    *,
    casts(*, member:members(*))
  `)
  if (filters.live_id) query = query.eq('live_id', filters.live_id)
  if (filters.leader_id) query = query.eq('leader_id', filters.leader_id)
  const { data, error } = await query.order('applied_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPlan({ live_id, band_name, song_count, leader_id, casts: castsData }) {
  const { data: plan, error } = await supabase
    .from('plans').insert({ live_id, band_name, song_count, leader_id }).select().single()
  if (error) throw error
  if (castsData?.length) {
    const rows = castsData.map(c => ({ plan_id: plan.plan_id, part: c.part, member_id: c.member_id || null }))
    const { error: e2 } = await supabase.from('casts').insert(rows)
    if (e2) throw e2
  }
  return plan
}

export async function updatePlan({ plan_id, live_id, band_name, song_count, leader_id, casts: castsData }) {
  const { error } = await supabase
    .from('plans').update({ live_id, band_name, song_count, leader_id }).eq('plan_id', plan_id)
  if (error) throw error
  await supabase.from('casts').delete().eq('plan_id', plan_id)
  if (castsData?.length) {
    const rows = castsData.map(c => ({ plan_id, part: c.part, member_id: c.member_id || null }))
    const { error: e2 } = await supabase.from('casts').insert(rows)
    if (e2) throw e2
  }
}

export async function deletePlan({ plan_id }) {
  const { error } = await supabase.from('plans').delete().eq('plan_id', plan_id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------
export async function getTimetable(liveId) {
  const { data, error } = await supabase
    .from('timetable').select(`*, plan:plans(*, casts(*, member:members(*)))`)
    .eq('live_id', liveId).order('day').order('order')
  if (error) throw error
  return data || []
}

export async function updateTimetable({ live_id, entries }) {
  const { error: delError } = await supabase.from('timetable').delete().eq('live_id', live_id)
  if (delError) throw delError
  if (entries?.length) {
    const rows = entries.map(e => ({ live_id, day: e.day, order: e.order, plan_id: e.plan_id }))
    const { error } = await supabase.from('timetable').insert(rows)
    if (error) throw error
  }
}

export async function confirmTimetable(liveId) {
  const { error } = await supabase
    .from('lives').update({ is_timetable_confirmed: true }).eq('live_id', liveId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export async function getTemplates(creatorId) {
  let query = supabase.from('templates').select(`
    *,
    casts:template_casts(*, member:members(*))
  `)
  if (creatorId) query = query.eq('creator_id', creatorId)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTemplate({ band_name, creator_id, casts: castsData }) {
  const { data: tmpl, error } = await supabase
    .from('templates').insert({ band_name, creator_id }).select().single()
  if (error) throw error
  if (castsData?.length) {
    const rows = castsData.map(c => ({ template_id: tmpl.template_id, part: c.part, member_id: c.member_id || null }))
    await supabase.from('template_casts').insert(rows)
  }
  return tmpl
}

export async function deleteTemplate({ template_id }) {
  const { error } = await supabase.from('templates').delete().eq('template_id', template_id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Member history
// ---------------------------------------------------------------------------
export async function getMemberHistory(memberId) {
  const { data, error } = await supabase
    .from('casts')
    .select('part, plan:plans(plan_id, band_name, live:lives(live_id, live_name, date1))')
    .eq('member_id', memberId)
  if (error) throw error
  return data || []
}

// ---------------------------------------------------------------------------
// Live Videos
// ---------------------------------------------------------------------------
export async function getLiveVideos() {
  const { data, error } = await supabase
    .from('live_videos').select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLiveVideo(payload) {
  const { data, error } = await supabase.from('live_videos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateLiveVideo({ video_id, ...fields }) {
  const { data, error } = await supabase
    .from('live_videos').update(fields).eq('video_id', video_id).select().single()
  if (error) throw error
  return data
}

export async function deleteLiveVideo(videoId) {
  const { error } = await supabase.from('live_videos').delete().eq('video_id', videoId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Room Reservations
// ---------------------------------------------------------------------------
export async function getRoomReservations(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  // last day: go to next month day 0
  const last = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('room_reservations')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date').order('slot')
  if (error) throw error
  return data || []
}

export async function createRoomReservation(payload) {
  const { data, error } = await supabase
    .from('room_reservations').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteRoomReservation(reservationId) {
  const { error } = await supabase
    .from('room_reservations').delete().eq('reservation_id', reservationId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------
export async function getFees(liveId) {
  const { data: live, error: e1 } = await supabase
    .from('lives').select('*').eq('live_id', liveId).single()
  if (e1) throw e1
  const plans = await getPlans({ live_id: liveId })
  const counts = {}
  const info = {}
  for (const plan of plans) {
    for (const cast of plan.casts || []) {
      if (cast.member_id && cast.member) {
        counts[cast.member_id] = (counts[cast.member_id] || 0) + 1
        info[cast.member_id] = cast.member
      }
    }
  }
  const fees = Object.entries(counts).map(([memberId, count]) => {
    let fee = 0
    if (live.fee_mode === 'flat') {
      fee = live.fee_flat || 0
    } else {
      if (count === 1) fee = live.fee_1plan || 0
      else if (count === 2) fee = live.fee_2plan || 0
      else fee = live.fee_3plan || 0
    }
    return { member: info[memberId], member_id: memberId, count, fee }
  })
  return { live, fees }
}
