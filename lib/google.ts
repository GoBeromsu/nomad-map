// Google Maps JS API 동적 로더.
// lib/kakao.ts의 싱글턴 프로미스 패턴을 그대로 따릅니다.
// NEXT_PUBLIC_GOOGLE_MAPS_KEY (Maps JS API 키)를 사용합니다.

declare global {
  interface Window {
    google: any;
    __nmGoogleMapsReady?: () => void;
  }
}

let loaderPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Maps는 브라우저에서만 로드할 수 있습니다."),
    );
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) return loaderPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  loaderPromise = new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY 가 설정되지 않았습니다."));
      return;
    }

    // Google Maps는 script.onload가 아닌 전역 콜백을 사용합니다.
    // 스크립트 태그를 추가하기 전에 반드시 등록해야 합니다.
    window.__nmGoogleMapsReady = () => {
      delete window.__nmGoogleMapsReady;
      resolve(window.google);
    };

    const existing = document.getElementById("google-maps-sdk");
    if (existing) {
      if (window.google && window.google.maps) {
        delete window.__nmGoogleMapsReady;
        resolve(window.google);
      }
      // else: SDK 초기화 완료 시 콜백이 호출됨
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.async = true;
    // loading=async: 비블로킹 부트스트랩 (Maps JS API v3.56+)
    // libraries=marker: AdvancedMarkerElement 포함 (deprecated Marker 대체)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=__nmGoogleMapsReady&loading=async&libraries=marker`;
    script.onerror = () => {
      delete window.__nmGoogleMapsReady;
      reject(
        new Error(
          "Google Maps SDK 로드 실패. API 키와 도메인 제한을 확인하세요.",
        ),
      );
    };
    document.head.appendChild(script);
  }).catch((e) => {
    // 실패 시 싱글턴을 비워 다음 호출에서 재시도 가능하게 함
    loaderPromise = null;
    throw e;
  });

  return loaderPromise;
}
