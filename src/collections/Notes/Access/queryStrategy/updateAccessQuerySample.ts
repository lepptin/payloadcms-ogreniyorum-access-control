import { Access, AccessResult } from 'payload'

// UPDATE: Sadece kendi notlarını güncelleyebilir[reference:13]
export const updateAccessQuerySample: Access = ({ req }): AccessResult => {
  if (!req.user) return false
  return { owner: { equals: req.user.id } }
}
