import { Access, AccessResult } from 'payload'

// UPDATE: Admin ve Editor tüm notları güncelleyebilir, Author sadece kendi notlarını
export const updateAccessRoleSample: Access = ({ req, data }): AccessResult => {
  if (!req.user) return false
  if (req.user.role === 'admin' || req.user.role === 'editor') return true
  return req.user.id === data?.owner
}
