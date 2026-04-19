"use client";

import { useEffect, useState } from "react";
import { useField, useFormFields, FieldLabel } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";

import style from "./TagsField.module.css";

interface ITagGroup {
  id: string;
  label: string;
  tags: string[];
}

const TagsField: TextFieldClientComponent = ({ field, path }) => {
  const fieldPath = path ?? field.name;
  const { value, setValue } = useField<string[]>({ path: fieldPath });
  const language = useFormFields(([fields]) => fields.language?.value as string | undefined);

  const [groups, setGroups] = useState<ITagGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    function fetchGroups() {
      if (!language) {
        setGroups([]);
        return;
      }
      const controller = new AbortController();
      setLoading(true);
      setError(null);

      fetch(`/api/app-tag-groups?language=${encodeURIComponent(language)}`, {
        signal: controller.signal,
      })
        .then(function handleResponse(response) {
          if (!response.ok) throw new Error("Failed to load tags");
          return response.json() as Promise<ITagGroup[]>;
        })
        .then(setGroups)
        .catch(function handleError(err: Error) {
          if (err.name !== "AbortError") setError(err.message);
        })
        .finally(function done() {
          setLoading(false);
        });

      return function cleanup() {
        controller.abort();
      };
    },
    [language]
  );

  const selected = value ?? [];

  function toggleTag(tag: string) {
    if (selected.includes(tag)) {
      setValue(selected.filter((t) => t !== tag));
    } else {
      setValue([...selected, tag]);
    }
  }

  return (
    <div className={style.container}>
      <FieldLabel label={field.label || "Tags"} path={fieldPath} required={field.required} />

      {!language && <p className={style.hint}>Select a language first</p>}
      {loading && <p className={style.hint}>Loading tags…</p>}
      {error && <p className={style.error}>{error}</p>}

      {language && !loading && groups.length === 0 && !error && (
        <p className={style.hint}>No tag groups configured for this language</p>
      )}

      {groups.map(function renderGroup(group) {
        return (
          <fieldset key={group.id} className={style.group}>
            <legend className={style.groupLabel}>{group.label}</legend>
            <div className={style.tags}>
              {group.tags.map(function renderTag(tag) {
                const checked = selected.includes(tag);
                return (
                  <label key={tag} className={style.tag}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTag(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {selected.length > 0 && (
        <p className={style.summary}>
          Selected: {selected.join(", ")}
        </p>
      )}
    </div>
  );
};

export default TagsField;
