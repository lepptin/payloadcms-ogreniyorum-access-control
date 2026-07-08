import { Access, AccessResult } from 'payload'

export const readAccessBooleanSample: Access = ({ req }): AccessResult => {
  if (req?.user && (req.user.role === 'admin' || req.user.role === 'author')) {
    return true
  }
  return false
}
