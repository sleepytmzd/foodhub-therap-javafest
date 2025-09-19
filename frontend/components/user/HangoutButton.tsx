"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateHangoutModal from "./CreateHangoutModal";

export default function HangoutButton({
  targetUserId,
  targetUserName,
  token,
}: {
  targetUserId: string;
  targetUserName?: string;
  token?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Hangout</Button>
      <CreateHangoutModal open={open} onOpenChange={setOpen} targetUserId={targetUserId} targetUserName={targetUserName} token={token} />
    </>
  );
}