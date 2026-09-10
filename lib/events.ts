/*
 * ヘッダーのポイント残高（PointsBadge）は、ポイントを動かす操作とは別の
 * ツリーにいる。Navbar は layout.tsx、クーポン引き換えは /shop/[id] の中なので、
 * props でつなぐには共通の親まで状態を持ち上げる必要がある。
 *
 * いま残高を動かす操作は1箇所しかないため、Context を用意せず window イベントで
 * 「取り直して」とだけ伝える。触る場所が増えたら Context に移す。
 */
export const POINTS_CHANGED = 'points:changed';

export function notifyPointsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(POINTS_CHANGED));
  }
}
