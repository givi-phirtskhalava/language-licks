import type { CollectionConfig } from 'payload'

import { adminOrEditor, superAdminOnly } from '@/lib/adminAuth/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Admin',
  },
  access: {
    read: () => true,
    create: adminOrEditor,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
