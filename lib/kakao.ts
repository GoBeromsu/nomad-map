// Kakao Maps JS SDK 동적 로더.
// NEXT_PUBLIC_KAKAO_MAP_KEY (JavaScript 키)를 사용하며, autoload=false 로 로드 후
// kakao.maps.load 콜백에서 resolve 합니다.

declare global {
  interface Window {
    kakao: any;
  }
}

let loaderPromise: Promise<any> | null = null;

export function loadKakaoMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Maps는 브라우저에서만 로드할 수 있습니다."));
  }

  if (window.kakao && window.kakao.maps) {
    return Promise.resolve(window.kakao);
  }

  if (loaderPromise) return loaderPromise;

  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  loaderPromise = new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되지 않았습니다."));
      return;
    }

    const existing = document.getElementById("kakao-maps-sdk");
    const onReady = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    if (existing) {
      if (window.kakao && window.kakao.maps) onReady();
      else existing.addEventListener("load", onReady);
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=clusterer,services`;
    script.onload = onReady;
    script.onerror = () =>
      reject(
        new Error(
          "Kakao Maps SDK 로드 실패. 앱 키와 사이트 도메인 등록을 확인하세요.",
        ),
      );
    document.head.appendChild(script);
  }).catch((e) => {
    // 실패 시 싱글턴을 비워 다음 호출에서 재시도 가능하게 함
    loaderPromise = null;
    throw e;
  });

  return loaderPromise;
}
