import { gsap } from 'gsap';
import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import {
  createCrossfade,
  createStageFadeIn,
  createStageRun,
  deskFrameSelector,
} from '../animation/deskStages';
import { CloudTransitionLayer } from '../components/CloudTransitionLayer';
import { DarkFadeLayer } from '../components/DarkFadeLayer';
import { DeskHubObjects } from '../components/DeskHubObjects';
import { DeskStageFrame } from '../components/DeskStageFrame';
import { DeskTransitionVideo, type DeskVideoPhase } from '../components/DeskTransitionVideo';
import { ModalHost } from '../components/modals/ModalHost';
import { UI_TEXT } from '../constants/copy';
import { DESK_DRAFT_SHEET_SOURCES, DESK_DRAFT_SHEETS } from '../constants/deskDraftSheets';
import { DESK_HUB_DECOR, DESK_HUB_DECOR_SOURCES } from '../constants/deskHubDecor';
import {
  DESK_HUB_LAYER_SOURCES,
  DESK_HUB_OBJECT_SOURCES,
  DESK_HUB_OBJECTS,
} from '../constants/deskHubObjects';
import {
  DARK_FADE_HOLD_MS,
  DESK_CLOUD_HOLD_MS,
  DESK_CLOUD_TIMINGS,
  DESK_DARK_FADE_TIMINGS,
  DESK_IMAGE_MAX_WAIT_MS,
  WIDE_HOLD_MS,
} from '../constants/deskTimings';
import {
  DESK_STAGE_FALLBACK_ASPECT_RATIO,
  DESK_STAGE_SOURCES,
  DESK_ZOOM_STAGES,
} from '../constants/deskZoomStages';
import { SCENE_LABELS } from '../constants/scenes';
import { useModalManager } from '../hooks/useModalManager';
import { usePreloadedImages } from '../hooks/usePreloadedImages';
import { useSceneTransition } from '../hooks/useSceneTransition';
import type { DeskStageId, SceneProps } from '../types';
import { prefersReducedMotion } from '../utils/motion';
import { msToSeconds } from '../utils/time';
import styles from './DeskScene.module.css';
import {
  createDeskSequenceReducer,
  INITIAL_DESK_SEQUENCE,
  toOverlayPhase,
  type DeskOverlayTransitionType,
} from './deskSequence';

const advanceDeskSequence = createDeskSequenceReducer(DESK_ZOOM_STAGES);

// Редактор раскладки стола: динамический импорт стоит за статически заменяемым
// `import.meta.env.DEV`, поэтому в production-сборку не попадают ни его код, ни стили.
const HubLayoutEditor = import.meta.env.DEV ? lazy(() => import('../dev/HubLayoutEditor')) : null;

/** Редактор раскладки включается флагом `?layout=1` в адресе — и только в dev-сборке. */
const isLayoutEditorRequested =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('layout') === '1';

/** Стадия, на которой поверх картинки стола лежат кликабельные предметы. */
const HUB_STAGE_ID: DeskStageId = 'hub';

/** Пауза под закрытым оверлеем, когда картинки новой стадии уже готовы. */
const OVERLAY_HOLD_MS: Readonly<Record<DeskOverlayTransitionType, number>> = {
  'dark-fade': DARK_FADE_HOLD_MS,
  clouds: DESK_CLOUD_HOLD_MS,
};

/**
 * Сцена «Desk» — сад, к столу в котором подъезжает камера. Полностью 2D, без Three.js:
 * полноэкранные картинки стадий и ролики-переходы между ними (`DESK_ZOOM_STAGES`
 * в `src/constants/deskZoomStages.ts`), сцена идёт по стадиям сама.
 *
 * 1. Первая стадия (общий план) проявляется и держится `WIDE_HOLD_MS`; если у стадии задан
 *    `zoom`, через `startDelayMs` её кадр плавно увеличивается к столу до `maxSafeScale`.
 * 2. Переход к следующей стадии — её `transitionIn`. Сейчас это ролик: камера наезжает
 *    от общего плана к столу, — а по его последнему кадру идёт затемнение (`dark-fade`),
 *    под которым появляется стол (`hub`) — финальная стадия. Если ролика нет
 *    или он не запустился, стадия показывается своим переходом без него, а
 *    `video-transition` сводится к перетеканию (`crossfade`). Облачный переход
 *    (`clouds`) тоже поддерживается, но в конфиге сейчас не используется.
 * 3. Стол (`desk-hub-empty.jpg`) пустой: предметы кладутся на него отдельными PNG —
 *    четыре кликабельных (`deskHubObjects.ts`, клик открывает модалку предмета), листы-черновики
 *    со своими модалками (`deskDraftSheets.ts`) и декор (`deskHubDecor.ts`, без клика
 *    и наведения, слоями под предметами и поверх них).
 *
 * В dev-сборке адрес с `?layout=1` включает редактор раскладки стола (`dev/HubLayoutEditor`):
 * предметы можно расставить мышью и скопировать готовые числа в конфиги.
 *
 * Стадиями управляет чистый редьюсер (`deskSequence.ts`). Все картинки предзагружаются
 * при появлении сцены; переход не показывает стадию, пока её картинки не готовы (но ждёт
 * не дольше `DESK_IMAGE_MAX_WAIT_MS`). Модалки — те же пять компонентов через свой
 * `ModalHost`: App не передаёт сценам управление модалками. Тайминги —
 * `src/constants/deskTimings.ts`.
 *
 * `onNext` из общего контракта сцен не используется: Desk — финальная сцена.
 * Default export — соглашение для модулей сцен (подключаются через `React.lazy`).
 */
const DeskScene: (props: SceneProps) => ReactElement = () => {
  const headingId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const { isTransitioning } = useSceneTransition();
  const stageImages = usePreloadedImages(DESK_STAGE_SOURCES, DESK_IMAGE_MAX_WAIT_MS);
  const objectImages = usePreloadedImages(DESK_HUB_OBJECT_SOURCES, DESK_IMAGE_MAX_WAIT_MS);
  const objectLayerImages = usePreloadedImages(DESK_HUB_LAYER_SOURCES, DESK_IMAGE_MAX_WAIT_MS);
  const decorImages = usePreloadedImages(DESK_HUB_DECOR_SOURCES, DESK_IMAGE_MAX_WAIT_MS);
  const sheetImages = usePreloadedImages(DESK_DRAFT_SHEET_SOURCES, DESK_IMAGE_MAX_WAIT_MS);
  const [{ stageIndex, transition }, dispatch] = useReducer(
    advanceDeskSequence,
    INITIAL_DESK_SEQUENCE,
  );
  const [isFirstStageShown, setFirstStageShown] = useState(false);
  const { activeModal, openModal, closeModal } = useModalManager();

  // «Дождались»: картинка готова, её нет (будет плейсхолдер) или ждать дольше не стоит.
  // Стол дожидается и картинок предметов (открытых книги и письма, огней на торте) с декором:
  // он должен появиться накрытым, а не собираться по частям на глазах.
  const areObjectImagesSettled =
    Object.values(objectImages).every((image) => image.status !== 'pending') &&
    Object.values(objectLayerImages).every((image) => image.status !== 'pending') &&
    Object.values(decorImages).every((image) => image.status !== 'pending') &&
    Object.values(sheetImages).every((image) => image.status !== 'pending');
  const isStageSettled = (index: number): boolean => {
    const stage = DESK_ZOOM_STAGES[index];
    if (!stage) {
      return true;
    }
    return (
      stageImages[stage.id].status !== 'pending' &&
      (stage.id !== HUB_STAGE_ID || areObjectImagesSettled)
    );
  };
  const isCurrentSettled = isStageSettled(stageIndex);
  const isNextSettled = isStageSettled(stageIndex + 1);
  // Кадрирование ролика — по картинке стадии, к которой он ведёт: пока он играет, это
  // следующая стадия, а когда он гаснет на своём последнем кадре — уже текущая.
  const stageAspectRatio = (index: number): number => {
    const stage = DESK_ZOOM_STAGES[index];
    const image = stage ? stageImages[stage.id] : undefined;
    return image?.status === 'ready'
      ? image.width / image.height
      : DESK_STAGE_FALLBACK_ASPECT_RATIO;
  };

  const isFirstStage = stageIndex === 0;
  const isHubStage = DESK_ZOOM_STAGES[stageIndex]?.id === HUB_STAGE_ID;
  const isCrossfading = transition.kind === 'crossfade';
  // Ролик перехода: пока играет и гаснет — сам себе переход, а под затемнением или облаками
  // стоит на последнем кадре, пока они закрывают экран.
  const transitionVideo: { src: string; phase: DeskVideoPhase } | null =
    transition.kind === 'video'
      ? { src: transition.src, phase: transition.phase }
      : transition.kind === 'overlay' && transition.video !== null
        ? { src: transition.video, phase: 'last-frame' }
        : null;
  const overlayType = transition.kind === 'overlay' ? transition.type : null;
  const isOverlayCovered = transition.kind === 'overlay' && transition.phase === 'covered';
  // Стадия «живёт» (пауза, зум), когда перехода нет. Первая — ещё и когда проявилась
  // и закончился общий переход между сценами: план должны увидеть целиком, а не из-за облаков.
  const isStageLive =
    transition.kind === 'none' && (!isFirstStage || (isFirstStageShown && !isTransitioning));

  // Первая стадия проявляется, как только есть что показать.
  useEffect(() => {
    const firstStage = DESK_ZOOM_STAGES[0];
    if (!isFirstStage || !isCurrentSettled || !firstStage) {
      return;
    }
    const frame = rootRef.current?.querySelector(deskFrameSelector(firstStage.id));
    if (!frame) {
      return;
    }
    const fadeIn = createStageFadeIn(frame, () => {
      setFirstStageShown(true);
    });
    return () => {
      fadeIn.kill();
    };
  }, [isFirstStage, isCurrentSettled]);

  // Стадия живёт: пауза, зум — и переход к следующей. Последняя стадия никуда не ведёт.
  useEffect(() => {
    const stage = DESK_ZOOM_STAGES[stageIndex];
    const hasNextStage = stageIndex + 1 < DESK_ZOOM_STAGES.length;
    if (!isStageLive || !stage || !hasNextStage) {
      return;
    }
    const frame = rootRef.current?.querySelector(deskFrameSelector(stage.id));
    if (!frame) {
      return;
    }
    const run = createStageRun(frame, {
      holdMs: stage.id === 'wide' ? WIDE_HOLD_MS : 0,
      zoom: stage.zoom,
      reducedMotion: prefersReducedMotion(),
      onComplete: () => {
        dispatch('advance');
      },
    });
    // kill, а не revert: переход начинается с уже приближенного кадра.
    return () => {
      run.kill();
    };
  }, [stageIndex, isStageLive]);

  // Перетекание: как только картинка следующей стадии готова, кадры перетекают друг в друга.
  useEffect(() => {
    const outgoing = DESK_ZOOM_STAGES[stageIndex];
    const incoming = DESK_ZOOM_STAGES[stageIndex + 1];
    const root = rootRef.current;
    if (!isCrossfading || !isNextSettled || !outgoing || !incoming || !root) {
      return;
    }
    const outgoingFrame = root.querySelector(deskFrameSelector(outgoing.id));
    const incomingFrame = root.querySelector(deskFrameSelector(incoming.id));
    if (!outgoingFrame || !incomingFrame) {
      return;
    }
    const crossfade = createCrossfade(outgoingFrame, incomingFrame, () => {
      dispatch('crossfaded');
    });
    return () => {
      crossfade.kill();
    };
  }, [stageIndex, isCrossfading, isNextSettled]);

  // Под закрытым оверлеем стадия уже подменена: ждём готовности её картинок и открываем.
  useEffect(() => {
    if (!isOverlayCovered || overlayType === null || !isCurrentSettled) {
      return;
    }
    const hold = gsap.delayedCall(msToSeconds(OVERLAY_HOLD_MS[overlayType]), () => {
      dispatch('reveal');
    });
    return () => {
      hold.kill();
    };
  }, [isOverlayCovered, overlayType, isCurrentSettled]);

  return (
    <section ref={rootRef} className={styles.scene} aria-labelledby={headingId}>
      <h1 id={headingId} className={styles.title}>
        {UI_TEXT.sceneTitle(SCENE_LABELS.desk)}
      </h1>
      {/* Кадр текущей стадии, а при перетекании поверх него — кадр следующей. У каждой
          стадии свой кадр (key), поэтому зум одной не переносится на другую. */}
      {DESK_ZOOM_STAGES.map((stage, index) => {
        const isIncoming = isCrossfading && index === stageIndex + 1;
        if (index !== stageIndex && !isIncoming) {
          return null;
        }
        return (
          <DeskStageFrame
            key={stage.id}
            stage={stage}
            image={stageImages[stage.id]}
            initiallyHidden={index === 0 || isIncoming}
          >
            {stage.id === HUB_STAGE_ID && (
              <DeskHubObjects
                objects={DESK_HUB_OBJECTS}
                images={objectImages}
                layerImages={objectLayerImages}
                decor={DESK_HUB_DECOR}
                decorImages={decorImages}
                sheets={DESK_DRAFT_SHEETS}
                sheetImages={sheetImages}
                onSelect={openModal}
              />
            )}
          </DeskStageFrame>
        );
      })}
      {/* Ролик-переход поверх уходящей стадии; на его последнем кадре она уже подменена. */}
      {transitionVideo && (
        <DeskTransitionVideo
          className={styles.transitionVideo}
          src={transitionVideo.src}
          phase={transitionVideo.phase}
          frameAspectRatio={stageAspectRatio(
            transitionVideo.phase === 'finishing' ? stageIndex : stageIndex + 1,
          )}
          onEnded={() => {
            dispatch('videoEnded');
          }}
          onFinished={() => {
            dispatch('videoFinished');
          }}
          onUnavailable={() => {
            dispatch('videoUnavailable');
          }}
        />
      )}
      <DarkFadeLayer
        className={styles.overlay}
        phase={toOverlayPhase(transition, 'dark-fade')}
        timings={DESK_DARK_FADE_TIMINGS}
        onCovered={() => {
          dispatch('covered');
        }}
        onRevealed={() => {
          dispatch('revealed');
        }}
      />
      {/* Облачный переход монтируется только на время перехода типа 'clouds'. */}
      {overlayType === 'clouds' && (
        <CloudTransitionLayer
          className={styles.overlay}
          phase={toOverlayPhase(transition, 'clouds')}
          timings={DESK_CLOUD_TIMINGS}
          onCovered={() => {
            dispatch('covered');
          }}
          onRevealed={() => {
            dispatch('revealed');
          }}
        />
      )}
      <ModalHost activeModal={activeModal} onClose={closeModal} />
      {isLayoutEditorRequested && HubLayoutEditor !== null && isHubStage && (
        <Suspense fallback={null}>
          <HubLayoutEditor />
        </Suspense>
      )}
    </section>
  );
};

export default DeskScene;
