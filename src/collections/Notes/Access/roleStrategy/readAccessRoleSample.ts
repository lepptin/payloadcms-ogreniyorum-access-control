import { Access, AccessResult } from 'payload'

// READ: Admin ve Editor tüm notları okuyabilir, Author sadece kendi notlarını
export const readAccessRoleSample: Access = ({ req, data }): AccessResult => {
  if (!req.user) return false
  if (req.user.role === 'admin' || req.user.role === 'editor' || req.user.role === 'author') return true
  return req.user.id === data?.owner // Author sadece kendi notları
}
