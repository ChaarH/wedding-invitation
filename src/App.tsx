import { useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import floralLeft from "./assets/images/xba9QFH.png";
import floralRight from "./assets/images/tGikO64.png";
import "./App.css";

declare global {
  interface Window {
    YT: any;
  }
}

function App() {
  // Configurações
  const START_AT = 3;
  const VIDEO_ID = "4WSY2nofMY8";

  // Estados
  const [needsUserAction, setNeedsUserAction] = useState(true); // overlay desde o primeiro paint
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [awaitingUnmute, setAwaitingUnmute] = useState(false); // sinaliza que clicamos e queremos desmutar ao entrar em PLAYING

  const playerRef = useRef<YouTubeEvent["target"] | null>(null);

  const onReady: YouTubeProps["onReady"] = async (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);

    // prepara iframe para autoplay inline (Safari)
    try {
      const iframe = await event.target.getIframe();
      iframe.setAttribute(
        "allow",
        "autoplay; encrypted-media; fullscreen; picture-in-picture"
      );
      iframe.setAttribute("playsinline", "1");
      iframe.setAttribute("webkit-playsinline", "1");
    } catch {}

    // Apenas posiciona o vídeo; não tenta tocar aqui
    try {
      event.target.mute();
      event.target.seekTo(START_AT, true);
    } catch {}
  };

  // Quando entrar em PLAYING depois do clique, desmuta (especialmente para Safari)
  const onStateChange: YouTubeProps["onStateChange"] = (event) => {
    const p = playerRef.current;
    if (!p) return;
    const YT = window.YT?.PlayerState;

    if (event.data === YT?.PLAYING) {
      if (awaitingUnmute) {
        try {
          p.setVolume(100);
          p.unMute();
        } catch {}
        setAwaitingUnmute(false);
      }
    }
  };

  // Tenta tocar; player precisa estar pronto
  const handleUserPlay = () => {
    const run = () => {
      const p = playerRef.current;
      if (!p) return;

      try {
        // Estratégia universal: começar mudo e tocar, depois desmutar ao entrar em PLAYING
        p.mute();
        p.seekTo(START_AT, true);
        setAwaitingUnmute(true);
        p.playVideo();
      } catch {}

      // Fallback com pequenas tentativas
      let attempts = 0;
      const maxAttempts = 4;
      const retry = setInterval(() => {
        attempts += 1;
        try {
          const state = p.getPlayerState(); // 1 = PLAYING
          if (state === window.YT.PlayerState.PLAYING) {
            clearInterval(retry);
            return;
          }
          if (attempts <= maxAttempts) {
            if (attempts === maxAttempts) {
              // último recurso: recarrega no tempo
              p.loadVideoById({
                videoId: VIDEO_ID,
                startSeconds: START_AT,
                suggestedQuality: "default",
              });
            } else {
              p.seekTo(START_AT, true);
              p.playVideo();
            }
          } else {
            clearInterval(retry);
          }
        } catch {
          // segue tentando até acabar attempts
        }
      }, 220);
    };

    // Some com o overlay já no primeiro clique
    setIsFadingOut(true);
    setTimeout(() => setNeedsUserAction(false), 500);

    if (!isPlayerReady || !playerRef.current) {
      const waiter = setInterval(() => {
        if (playerRef.current && isPlayerReady) {
          clearInterval(waiter);
          run();
        }
      }, 80);
    } else {
      run();
    }
  };

  // Player oculto visualmente, mas **sem display:none**
  const opts = {
    height: "1", // evita display:none
    width: "1",
    playerVars: {
      autoplay: 0,       // não tocar sozinho; só após clique
      controls: 0,
      disablekb: 1,
      fs: 0,
      rel: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      mute: 1,
      start: START_AT,
    },
  };

  return (
    <div className="relative min-h-screen w-full min-w-full bg-[#F8F7F2] overflow-hidden flex items-center justify-center px-6 py-12 text-[#665D3C] font-serif">
      {/* Player YouTube (offscreen/opacity-0, mas NÃO display:none) */}
      <div className="absolute -z-10 opacity-0 pointer-events-none">
        <YouTube
          videoId={VIDEO_ID}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
        />
      </div>

      {/* OVERLAY: blur em camada separada + botão (sem blur) */}
      {needsUserAction && (
        <>
          {/* Camada do blur (sem filhos) */}
          <div
            className={`fixed inset-0 z-[48] bg-white/60 supports-[backdrop-filter]:backdrop-blur-md
                        ${isFadingOut ? 'transition-opacity duration-500 ease-in-out opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-hidden="true"
          />
          {/* Camada do botão */}
          <div
            className={`fixed inset-0 z-[50] flex items-center justify-center
                        ${isFadingOut ? 'transition-opacity duration-500 ease-in-out opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <button
              onClick={handleUserPlay}
              className="px-6 py-3 rounded-lg font-medium
                         bg-black text-white shadow-lg text-lg
                         focus:outline-none focus:ring-4 focus:ring-purple-300
                         transition-colors
                         mix-blend-normal
                         appearance-none [-webkit-appearance:none]"
              style={{
                backgroundColor: "#000",
                color: "#fff",
                WebkitBackdropFilter: "none",
                backdropFilter: "none",
              }}
            >
              🎵 Tocar música
            </button>
          </div>
        </>
      )}

      {/* Decoração floral superior esquerda */}
      <img
        src={floralLeft}
        alt=""
        className="absolute top-[-80px] left-[-40px] w-[200px] md:w-[230px] rotate-45 opacity-90 pointer-events-none select-none z-0"
      />

      {/* Decoração floral superior direita */}
      <img
        src={floralRight}
        alt=""
        className="absolute top-[-80px] right-[-80px] w-[300px] md:w-[400px] opacity-60 pointer-events-none select-none z-0"
      />

      {/* Decoração floral inferior esquerda */}
      <img
        src={floralRight}
        alt=""
        className="absolute bottom-[-120px] left-[-80px] w-[400px] sm:w-[400px] opacity-60 pointer-events-none select-none z-0"
      />

      {/* Conteúdo principal */}
      <div className="relative z-10 text-center space-y-6 max-w-2xl">
        <h2 className="text-sm tracking-widest uppercase font-sans">
          VAMOS NOS CASAR ...
        </h2>

        <h1 className="tracking-widest font-serif leading-snug text-xs">
          <span className="block">SALVE</span>
          <span className="block">A</span>
          <span className="block">DATA</span>
        </h1>

        <p className="text-lg md:text-xl font-serif leading-relaxed text-[#665D3C]">
          Dia <span className="font-semibold text-[#8B79C2]">09</span> de{" "}
          <span className="text-[#8B79C2] font-semibold">janeiro</span> de 2026
          <br />
          Às <span className="font-bold">14:30</span> -{" "}
          <span className="uppercase font-bold">Sexta-feira</span>
          <br />
          São Lourenço MG
        </p>

        <p className="text-base font-serif text-[#665D3C] mt-2">
          A confirmação de presença é necessária,<br />
          mas não se preocupe pois nossa cerimonialista<br />
          entrará em contato com você.
        </p>

        <div className="text-white">
          <a
            href="https://noivos.casar.com/melissa-e-nicolau#/admin/plano"
            className="underline text-white bg-purple-400 hover:bg-purple-500 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
          >
            Acesse nosso site
          </a>
        </div>

        <footer className="md:hidden sm:block text-sm uppercase tracking-widest font-serif text-[#665D3C] text-lg">
          MELISSA <span className="mx-2 text-[#8B79C2]">&</span> NICOLAU
        </footer>
      </div>

      <footer className="hidden sm:hidden md:block absolute bottom-10 right-10 text-right text-sm uppercase tracking-widest font-serif text-[#665D3C] text-lg">
        MELISSA <span className="mx-2 text-[#8B79C2]">&</span> NICOLAU
      </footer>
    </div>
  );
}

export default App;
