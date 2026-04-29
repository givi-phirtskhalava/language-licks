"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import classNames from "classnames";
import { Button } from "@payloadcms/ui";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableRow from "./SortableRow";

import { LANGUAGES, DEFAULT_LANGUAGE, type TLanguageId } from "@/lib/projectConfig";

import style from "./LessonBoard.module.css";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type TCefr = (typeof CEFR_LEVELS)[number];

export interface ILesson {
  id: number;
  sentence: string;
  translation: string;
  language: TLanguageId;
  cefr: TCefr;
  order: number;
  isFree: boolean;
  _status?: "draft" | "published" | "changed";
}

const STORAGE_CEFR_KEY = "lessonBoard:cefr";

function isLanguageId(value: string | null): value is TLanguageId {
  return LANGUAGES.some(function match(l) {
    return l.id === value;
  });
}

export default function LessonBoardClient() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("language");
  const language: TLanguageId = isLanguageId(langParam)
    ? langParam
    : DEFAULT_LANGUAGE;

  const [cefr, setCefr] = useState<TCefr>("A1");
  const [search, setSearch] = useState("");
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(function loadFromStorage() {
    const storedCefr = window.localStorage.getItem(STORAGE_CEFR_KEY);
    if (
      storedCefr !== null &&
      (CEFR_LEVELS as readonly string[]).includes(storedCefr)
    ) {
      setCefr(storedCefr as TCefr);
    }
  }, []);

  function handleCefrChange(next: TCefr) {
    setCefr(next);
    window.localStorage.setItem(STORAGE_CEFR_KEY, next);
  }

  useEffect(
    function loadLessons() {
      const controller = new AbortController();
      setLoading(true);

      const base =
        `where[language][equals]=${encodeURIComponent(language)}` +
        `&limit=1000&depth=0`;
      const allUrl = `/api/lessons?${base}&sort=cefr,order,id&draft=true`;
      const publishedUrl = `/api/lessons?${base}&where[_status][equals]=published`;

      Promise.all([
        fetch(allUrl, {
          signal: controller.signal,
          credentials: "include",
        }).then(function parse(response) {
          if (!response.ok) throw new Error("Failed to load lessons");
          return response.json() as Promise<{ docs: ILesson[] }>;
        }),
        fetch(publishedUrl, {
          signal: controller.signal,
          credentials: "include",
        }).then(function parse(response) {
          if (!response.ok) throw new Error("Failed to load lessons");
          return response.json() as Promise<{ docs: { id: number }[] }>;
        }),
      ])
        .then(function apply([allData, publishedData]) {
          const publishedIds = new Set(
            publishedData.docs.map(function toId(d) {
              return d.id;
            })
          );

          const normalized = allData.docs.map(function enrich(l) {
            const status =
              l._status === "draft" && publishedIds.has(l.id)
                ? "changed"
                : l._status;
            return { ...l, cefr: l.cefr ?? "A1", _status: status };
          });

          setLessons(normalized);
          setLoading(false);
        })
        .catch(function onError(err: Error) {
          if (err.name !== "AbortError") setLoading(false);
        });

      return function cleanup() {
        controller.abort();
      };
    },
    [language]
  );

  const counts = useMemo(
    function computeCounts() {
      const out: Record<TCefr, number> = {
        A1: 0,
        A2: 0,
        B1: 0,
        B2: 0,
        C1: 0,
        C2: 0,
      };
      for (const lesson of lessons) {
        if (lesson.cefr in out) out[lesson.cefr]++;
      }
      return out;
    },
    [lessons]
  );

  const visible = useMemo(
    function applyFilters() {
      const needle = search.trim().toLowerCase();
      return lessons
        .filter(function byCefr(l) {
          return l.cefr === cefr;
        })
        .filter(function bySearch(l) {
          if (needle === "") return true;
          return (
            l.sentence.toLowerCase().includes(needle) ||
            l.translation.toLowerCase().includes(needle)
          );
        })
        .sort(function byOrder(a, b) {
          return a.order - b.order || a.id - b.id;
        });
    },
    [lessons, cefr, search]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const oldIndex = visible.findIndex(function match(l) {
      return l.id === activeId;
    });
    const newIndex = visible.findIndex(function match(l) {
      return l.id === overId;
    });
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(visible, oldIndex, newIndex);

    const lo = Math.min(oldIndex, newIndex);
    const hi = Math.max(oldIndex, newIndex);
    const orderSlots = visible.slice(lo, hi + 1).map(function toOrder(l) {
      return l.order;
    });
    const affected = reordered.slice(lo, hi + 1);

    const updates = affected.map(function pairWithSlot(l, i) {
      return { id: l.id, order: orderSlots[i] };
    });

    const updateMap = new Map(
      updates.map(function toEntry(u) {
        return [u.id, u.order] as const;
      })
    );

    const previousLessons = lessons;
    setLessons(function applyOptimistic(prev) {
      return prev.map(function remap(l) {
        const next = updateMap.get(l.id);
        if (next === undefined) return l;
        return { ...l, order: next };
      });
    });

    try {
      await Promise.all(
        updates.map(function persist(u) {
          return fetch(`/api/lessons/${u.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ order: u.order }),
          }).then(function check(r) {
            if (!r.ok) throw new Error(`Failed to update lesson ${u.id}`);
          });
        })
      );
    } catch {
      setLessons(previousLessons);
    }
  }

  const totalCount = lessons.length;
  const searchActive = search.trim() !== "";
  const visibleIds = visible.map(function toId(l) {
    return l.id;
  });

  return (
    <>
      <div className={style.header}>
        <div className={style.headerRow}>
          <div className={style.totalCount}>
            <span className={style.totalLabel}>Total</span>
            <span className={style.totalValue}>{totalCount}</span>
          </div>

          <Button
            buttonStyle="pill"
            size="small"
            el="link"
            className={style.createButton}
            to={`/admin/collections/lessons/create?language=${language}&cefr=${cefr}`}
          >
            Create New
          </Button>
        </div>

        <input
          type="text"
          className={style.search}
          placeholder="Search sentence or translation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={style.cefrTabs}>
          {CEFR_LEVELS.map(function renderCefr(lvl) {
            const active = cefr === lvl;
            return (
              <button
                key={lvl}
                type="button"
                className={classNames(
                  style.cefrTab,
                  active && style.cefrTabActive
                )}
                onClick={() => handleCefrChange(lvl)}
              >
                <span className={style.cefrLabel}>{lvl}</span>
                <span className={style.cefrCount}>{counts[lvl]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={style.content}>
        {loading && <div className={style.empty}>Loading…</div>}

        {!loading && visible.length === 0 && (
          <div className={style.empty}>No lessons match this filter.</div>
        )}

        {!loading && visible.length > 0 && searchActive && (
          <div className={style.searchHint}>
            Clear the search to reorder lessons by dragging.
          </div>
        )}

        {!loading && visible.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleIds}
              strategy={verticalListSortingStrategy}
            >
              <div className={style.list}>
                {visible.map(function renderRow(lesson) {
                  return (
                    <SortableRow
                      key={lesson.id}
                      lesson={lesson}
                      dragDisabled={searchActive}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  );
}
