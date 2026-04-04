import { GAS_URL } from './config.js'

async function callApi(action, data = {}) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured')
  }
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  })
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  const result = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }
  return result
}

export const getMembers = (filters = {}) => callApi('getMembers', filters)
export const registerMember = (data) => callApi('registerMember', data)
export const updateMember = (data) => callApi('updateMember', data)
export const updateProfile = (data) => callApi('updateProfile', data)
export const uploadPhoto = (data) => callApi('uploadPhoto', data)

export const getLives = (filters = {}) => callApi('getLives', filters)
export const createLive = (data) => callApi('createLive', data)
export const updateLive = (data) => callApi('updateLive', data)

export const getPlans = (filters = {}) => callApi('getPlans', filters)
export const createPlan = (data) => callApi('createPlan', data)
export const updatePlan = (data) => callApi('updatePlan', data)
export const deletePlan = (data) => callApi('deletePlan', data)

export const getTimetable = (liveId) => callApi('getTimetable', { live_id: liveId })
export const updateTimetable = (data) => callApi('updateTimetable', data)
export const confirmTimetable = (liveId) => callApi('confirmTimetable', { live_id: liveId })

export const getTemplates = (creatorUid) => callApi('getTemplates', { creator_uid: creatorUid })
export const createTemplate = (data) => callApi('createTemplate', data)
export const deleteTemplate = (data) => callApi('deleteTemplate', data)

export const getFees = (liveId) => callApi('getFees', { live_id: liveId })
