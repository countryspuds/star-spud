import { Suspense, use } from "react";
import { Navigate } from "react-router-dom";
import { getEvents } from "../../data";
import { SIDO, isSidoCode } from "../../data/regions";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillLink } from "../../components/ui/Pill";
import { POTATO_AVATAR_SRC } from "../../lib/potatoAvatar";
import { AuthFrame, Steps } from "./AuthFrame";
import { useMe } from "./useMe";
import styles from "./auth.module.css";

/** 다음 major 이벤트 — 홈과 같은 mock(`events.json`)의 첫 항목 */
function NextEventTodo() {
  const events = use(getEvents());
  const next = events[0];
  return (
    <>
      <strong>{next ? `${next.title} 알림 받기` : "다음 이벤트 알림 받기"}</strong>
      <span>
        캘린더에서 큰 이벤트를 미리 확인해요 <ExampleCaption />
      </span>
    </>
  );
}

/** `/welcome` — 온보딩 완료 (명세 §14) */
export function WelcomePage() {
  const me = useMe();
  if (!me) return <Navigate to="/login" replace />;
  if (me.nickname === null) return <Navigate to="/onboarding" replace />;

  const sidoName = me.homeSido && isSidoCode(me.homeSido) ? SIDO[me.homeSido].name : null;

  return (
    <AuthFrame
      label="STAR-SPUD · WELCOME"
      title="첫 감자가 자리를 잡았어요"
      body="이제 오늘 밤 갈 곳을 고르고, 다녀온 뒤 기록을 남기면 감자가 자라요."
    >
      <Steps
        active={[3]}
        labels={me.providers.includes("email") ? (["계정", "닉네임", "완료"] as const) : undefined}
      />
      <div className={styles.welcome}>
        <img
          src={POTATO_AVATAR_SRC[me.potatoAvatar]}
          alt=""
          width={96}
          height={96}
          className="pixelated"
        />
        <Label>가입 완료</Label>
        <h2 className={styles.h2}>환영해요, {me.nickname}</h2>
        <p className={styles.lead}>
          {sidoName
            ? `${sidoName} 기준으로 오늘 밤을 추천해 드릴게요.`
            : "설정에서 지역을 고르면 오늘 밤을 추천해 드릴게요."}
        </p>

        <ol className={styles.todos}>
          <li>
            <span className={styles.todoNum}>01</span>
            <div>
              <strong>오늘 밤 어디 갈지 고르기</strong>
              <span>별보기 지도에서 점수 높은 곳을 찾아요</span>
            </div>
          </li>
          <li>
            <span className={styles.todoNum}>02</span>
            <div>
              <strong>다녀와서 감자 심기</strong>
              <span>후기와 사진을 남기면 그 명소에 감자가 생겨요</span>
            </div>
          </li>
          <li>
            <span className={styles.todoNum}>03</span>
            <div>
              <Suspense fallback={<strong>다음 이벤트 알림 받기</strong>}>
                <NextEventTodo />
              </Suspense>
            </div>
          </li>
        </ol>

        <div className={styles.actions}>
          <PillLink to="/map" tone="primary">
            별보기 지도 열기
          </PillLink>
          <PillLink to="/" tone="secondary">
            홈으로
          </PillLink>
        </div>
      </div>
    </AuthFrame>
  );
}
