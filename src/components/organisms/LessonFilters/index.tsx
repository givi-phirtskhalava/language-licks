"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import Modal from "@atoms/Modal";
import FilterChip from "@atoms/FilterChip";
import useTags from "@lib/hooks/useTags";
import style from "./LessonFilters.module.css";

interface Props {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function LessonFilters({ selectedTags, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: tagGroups } = useTags();

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  }

  function clearAll() {
    onChange([]);
  }

  const hasSelection = selectedTags.length > 0;

  return (
    <div className={style.container}>
      <div className={style.bar}>
        <button
          className={classNames(
            style.filterBtn,
            hasSelection && style.filterBtnActive
          )}
          onClick={() => setIsOpen(true)}
        >
          <FontAwesomeIcon icon={faSliders} />
          <span>Filters</span>
          {hasSelection && (
            <span className={style.count}>{selectedTags.length}</span>
          )}
        </button>

        {hasSelection && (
          <button className={style.clearBtn} onClick={clearAll}>
            Clear
          </button>
        )}
      </div>

      {hasSelection && (
        <div className={style.activeChips}>
          {selectedTags.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              selected
              showRemove
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <div className={style.modalBody}>
            <div className={style.modalHeader}>
              <p className={style.modalTitle}>Filter lessons</p>
              {hasSelection && (
                <button className={style.clearBtn} onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            {(tagGroups ?? []).map((group) => (
              <section key={group.id} className={style.group}>
                <p className={style.groupLabel}>{group.label}</p>
                <div className={style.groupChips}>
                  {group.tags.map((tag) => (
                    <FilterChip
                      key={tag}
                      label={tag}
                      selected={selectedTags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                    />
                  ))}
                </div>
              </section>
            ))}

            <button
              className={style.doneBtn}
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
