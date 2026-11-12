import ExpoModulesCore

public class ScreenshotHiddenModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenshotHidden")

    View(ScreenshotHiddenView.self) {}
  }
}
