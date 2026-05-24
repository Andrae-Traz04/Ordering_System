import AsyncStorage from '@react-native-async-storage/async-storage'
import { register, updateProfile } from '../api/client'

const PENDING_REG_KEY = 'PENDING_REGISTRATION'
const PENDING_PROFILE_KEY = 'PENDING_PROFILE_UPLOAD'

export const savePendingRegistration = async (payload: any) => {
  try {
    await AsyncStorage.setItem(PENDING_REG_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('savePendingRegistration error', err)
  }
}

export const getPendingRegistration = async () => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_REG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('getPendingRegistration error', err)
    return null
  }
}

export const removePendingRegistration = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_REG_KEY)
  } catch (err) {
    console.error('removePendingRegistration error', err)
  }
}

export const savePendingProfileUpload = async (payload: any) => {
  try {
    await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('savePendingProfileUpload error', err)
  }
}

export const getPendingProfileUpload = async () => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('getPendingProfileUpload error', err)
    return null
  }
}

export const removePendingProfileUpload = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_PROFILE_KEY)
  } catch (err) {
    console.error('removePendingProfileUpload error', err)
  }
}

// Attempt to process any pending uploads/registrations. Call this on app startup and when network returns.
export const processPendingUploads = async () => {
  try {
    const pendingReg = await getPendingRegistration()
    if (pendingReg) {
      try {
        // Send as JSON; backend may accept base64 fields
        await register(pendingReg)
        console.log('Pending registration uploaded')
        await removePendingRegistration()
      } catch (err) {
        console.error('Failed to process pending registration', err)
      }
    }

    const pendingProfile = await getPendingProfileUpload()
    if (pendingProfile) {
      try {
        // Use updateProfile which accepts base64 in other flows
        await updateProfile({
          profile_image_base64: pendingProfile.base64,
          profile_image_type: pendingProfile.mimeType || 'image/jpeg',
        })
        console.log('Pending profile upload processed')
        await removePendingProfileUpload()
      } catch (err) {
        console.error('Failed to process pending profile upload', err)
      }
    }
  } catch (err) {
    console.error('processPendingUploads error', err)
  }
}

export default {
  savePendingRegistration,
  getPendingRegistration,
  removePendingRegistration,
  savePendingProfileUpload,
  getPendingProfileUpload,
  removePendingProfileUpload,
  processPendingUploads,
}
