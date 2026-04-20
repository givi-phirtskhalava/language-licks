"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LanguageCard from "@/components/organisms/LanguageCard";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES, TLanguageId } from "@lib/projectConfig";
import styles from "../../page.module.css";

export default function LessonPage() {
  const params = useParams<{ language: string; id: string }>();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const urlLanguage = params.language as TLanguageId;
  const lessonId = Number(params.id);
  const isValidLanguage = LANGUAGES.some((l) => l.id === urlLanguage);

  useEffect(() => {
    if (isValidLanguage && urlLanguage !== language) {
      setLanguage(urlLanguage);
    }
  }, [isValidLanguage, urlLanguage, language, setLanguage]);

  function handleBack() {
    router.push("/lessons");
  }

  if (!isValidLanguage || !Number.isFinite(lessonId)) {
    return null;
  }

  return (
    <main className={styles.main}>
      <LanguageCard lessonId={lessonId} onBack={handleBack} />
    </main>
  );
}
