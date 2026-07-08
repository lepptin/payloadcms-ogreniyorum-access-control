import { Access, AccessResult } from 'payload'

// READ: Herkes kendi notlarını görebilir, public olanları herkes görebilir[reference:11]
export const readAccessQuerySample:Access = ({ req }):AccessResult => {
  if (!req.user) {
    // Anonim kullanıcı sadece public notları görebilir[reference:12]
    return { isPublic: { equals: true } }
  }
  // Giriş yapmış kullanıcı: kendi notları + public notlar
  return {
    or: [{ owner: { equals: req.user.id } }, { isPublic: { equals: true } }],
  }
}
