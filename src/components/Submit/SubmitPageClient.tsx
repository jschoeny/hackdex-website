"use client";

import React from "react";
import HackForm from "@/components/Hack/HackForm";
import ArchiveModeSelector from "@/components/Submit/ArchiveModeSelector";

export default function SubmitPageClient({ canCreateArchive, dummy }: { canCreateArchive: boolean; dummy: boolean }) {
  const [showModeSelector, setShowModeSelector] = React.useState(canCreateArchive);
  const [isArchive, setIsArchive] = React.useState(false);

  if (showModeSelector) {
    return <ArchiveModeSelector onSelect={(archive) => { setIsArchive(archive); setShowModeSelector(false); }} />;
  }

  return <HackForm mode="create" dummy={dummy} isArchive={isArchive} />;
}
