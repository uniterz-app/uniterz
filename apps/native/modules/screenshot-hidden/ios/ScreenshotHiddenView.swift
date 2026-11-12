import ExpoModulesCore
import UIKit

/// 子をスクショ・画面収録・ミラーリングに写さない。
/// 画面には普通に見え、タップもできる。
/// 安全入力の UITextField が中身を描く canvas は、OS がキャプチャから外す。その canvas を入れ物に使う。
/// canvas が見つからない iOS では普通の UIView に載せる（写るだけで壊れない）。
final class ScreenshotHiddenView: ExpoView {
  private let secureField = UITextField()
  private lazy var container: UIView = makeContainer()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = false
    addSubview(container)
  }

  private func makeContainer() -> UIView {
    secureField.isSecureTextEntry = true
    let canvas = secureField.subviews.first { view in
      String(describing: type(of: view)).contains("CanvasView")
    }
    guard let canvas else {
      return UIView()
    }
    canvas.subviews.forEach { $0.removeFromSuperview() }
    canvas.isUserInteractionEnabled = true
    canvas.clipsToBounds = false
    canvas.backgroundColor = .clear
    return canvas
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    container.frame = bounds
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    container.insertSubview(childComponentView, at: index)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
  }

  /// 入れ物自体はタッチを取らない（子が無い所は下へ通す）
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let hit = super.hitTest(point, with: event)
    if hit === self || hit === container {
      return nil
    }
    return hit
  }
}
