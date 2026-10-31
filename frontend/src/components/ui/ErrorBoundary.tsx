import { Component, type ReactNode } from "react";

interface Props {
  /** 오류 시 보여줄 내용. retry()를 부르면 자식을 다시 그린다 */
  fallback: (error: Error, retry: () => void) => ReactNode;
  /** 오류를 받은 직후 한 번 (캐시 무효화 등) */
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** `use()`로 읽은 Promise가 거부됐을 때 받아주는 경계 — React 19는 훅으로 제공하지 않아 클래스로 둔다 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error instanceof Error ? error : new Error(String(error)));
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    return error ? this.props.fallback(error, this.retry) : this.props.children;
  }
}
