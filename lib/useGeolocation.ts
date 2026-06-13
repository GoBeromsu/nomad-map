"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable";

export interface GeoState {
  status: GeoStatus;
  coords: { lat: number; lng: number } | null;
  request: () => void;
}

// 사용자 기기의 현재 위치를 가져오는 훅.
// 마운트 시 1회 자동 요청하고, request()로 재시도 가능.
export function useGeolocation(autoRequest = true): GeoState {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return { status, coords, request };
}
