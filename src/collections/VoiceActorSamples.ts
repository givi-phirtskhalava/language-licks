import type { CollectionConfig } from "payload";
import { randomBytes } from "crypto";

import { adminOrEditor, superAdminOnly } from "@/lib/adminAuth/access";

export const VoiceActorSamples: CollectionConfig = {
  slug: "voice-actor-samples",
  labels: {
    singular: "Voice Actor Sample",
    plural: "Voice Actor Samples",
  },
  admin: {
    useAsTitle: "filename",
    hidden: true,
  },
  upload: {
    mimeTypes: ["audio/mpeg"],
  },
  access: {
    read: () => true,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: superAdminOnly,
  },
  fields: [],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (!req.file) return data;

        const hash = randomBytes(6).toString("hex");
        data.filename = `${hash}.mp3`;
        data.prefix = "voice-actor-samples";

        return data;
      },
    ],
  },
};
