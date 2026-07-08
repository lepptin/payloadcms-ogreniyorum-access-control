import { CollectionConfig, Where } from 'payload'

//Access Control - Query Strategy
import { readAccessQuerySample } from './Access/queryStrategy/readAccessQuerySample'
import { createAccessQuerySample } from './Access/queryStrategy/createAccessQuerySample'
import { updateAccessQuerySample } from './Access/queryStrategy/updateAccessQuerySample'
import { deleteAccessQuerySample } from './Access/queryStrategy/deleteAccessQuerySample'

//Access Control - role strategy
import { readAccessRoleSample } from './Access/roleStrategy/readAccessRoleSample'
import { createAccessRoleSample } from './Access/roleStrategy/createAccessRoleSample'
import { updateAccessRoleSample } from './Access/roleStrategy/updateAccessRoleSample'
import { deleteAccessRoleSample } from './Access/roleStrategy/deleteAccessRoleSample'

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    defaultColumns: ['owner', 'title', 'content', 'isPublic'],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      
    },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    { name: 'isPublic', type: 'checkbox', defaultValue: false },
  ],
  access: {
    read: readAccessRoleSample,
    create: createAccessRoleSample,
    update: updateAccessRoleSample,
    delete: deleteAccessRoleSample,
  },
}
