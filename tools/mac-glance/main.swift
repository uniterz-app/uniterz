import AppKit
import CoreGraphics
import Foundation

/// デスクトップの写真ウィジェットの下に、登録と今日の予想を出す。
final class GlanceApp: NSObject, NSApplicationDelegate, NSWindowDelegate {
  private var window: NSWindow!
  private var widget: GlanceWidgetView!
  private var timer: Timer?
  private var requestSerial = 0
  private var didPlace = false
  private var selectedDayKey: String
  private var memory: [String: Stats] = [:]
  private var pickerPanel: NSPanel?
  private var picker: NSDatePicker?
  private var pickerMonitor: Any?
  private let root: String
  private let node: String
  private let cacheURL: URL
  private let originKey = "widgetOrigin"
  private let dayDefaultsKey = "selectedDayKey"

  private let numberFormatter: NumberFormatter = {
    let fmt = NumberFormatter()
    fmt.numberStyle = .decimal
    fmt.locale = Locale(identifier: "ja_JP")
    return fmt
  }()

  init(root: String, node: String) {
    self.root = root
    self.node = node
    let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("UniterzGlance", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    self.cacheURL = dir.appendingPathComponent("last.json")
    let today = GlanceDay.todayKey()
    let pinned = UserDefaults.standard.string(forKey: "selectedDayKey")
    self.selectedDayKey = pinned != nil && pinned! <= today ? pinned! : today
    super.init()
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)

    let frame = savedFrame() ?? frameUnderDesktopWidgets()
    window = NSWindow(
      contentRect: frame,
      styleMask: [.borderless],
      backing: .buffered,
      defer: false
    )
    window.delegate = self
    window.isOpaque = false
    window.backgroundColor = .clear
    window.hasShadow = false
    window.level = widgetLevel
    window.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
    window.isMovableByWindowBackground = true
    window.hidesOnDeactivate = false
    window.animationBehavior = .none

    widget = GlanceWidgetView(frame: NSRect(origin: .zero, size: frame.size))
    widget.onRefresh = { [weak self] in self?.refreshNow() }
    widget.onResetPosition = { [weak self] in self?.resetPosition() }
    widget.onQuit = { NSApp.terminate(nil) }
    widget.onDragged = { [weak self] origin in
      UserDefaults.standard.set(["x": origin.x, "y": origin.y], forKey: self?.originKey ?? "widgetOrigin")
    }
    widget.onShiftDay = { [weak self] delta in self?.shiftDay(by: delta) }
    widget.onPickDate = { [weak self] in self?.toggleDatePicker() }
    window.contentView = widget
    widget.setNextEnabled(selectedDayKey < GlanceDay.todayKey())
    pin()
    window.orderFrontRegardless()

    if let cached = loadCache(), cached.dayKey == selectedDayKey {
      memory[cached.dayKey] = cached
      render(cached)
    } else {
      widget.setDayLabel(GlanceDay.label(selectedDayKey), isToday: selectedDayKey == GlanceDay.todayKey())
    }
    didPlace = true
    refreshNow()
    timer = Timer.scheduledTimer(withTimeInterval: 5 * 60, repeats: true) { [weak self] _ in
      self?.refreshNow()
    }
  }

  func windowDidMove(_ notification: Notification) {
    pin()
  }

  private func pin() {
    window.level = widgetLevel
  }

  private func resetPosition() {
    UserDefaults.standard.removeObject(forKey: originKey)
    let frame = frameUnderDesktopWidgets()
    window.setFrame(frame, display: true)
  }

  private func savedFrame() -> NSRect? {
    guard let raw = UserDefaults.standard.dictionary(forKey: originKey),
          let x = raw["x"] as? Double,
          let y = raw["y"] as? Double
    else { return nil }
    return NSRect(x: x, y: y, width: GlanceMetrics.width, height: GlanceMetrics.height)
  }

  /// 通知センターのデスクトップウィジェット列の真下。座標は画面上端原点。
  private func frameUnderDesktopWidgets() -> NSRect {
    let fallback = NSRect(x: 8, y: 401, width: GlanceMetrics.width, height: GlanceMetrics.height)
    guard let info = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] else {
      return nsRect(fromTopLeft: fallback)
    }

    var left = CGFloat.greatestFiniteMagnitude
    var right = CGFloat.zero
    var bottom = CGFloat.zero
    var found = false
    for raw in info {
      let owner = raw[kCGWindowOwnerName as String] as? String ?? ""
      guard owner == "通知センター" else { continue }
      let layer = raw[kCGWindowLayer as String] as? Int ?? 0
      guard layer < 0 else { continue }
      guard let bounds = raw[kCGWindowBounds as String] as? [String: CGFloat] else { continue }
      let x = bounds["X"] ?? 0
      let y = bounds["Y"] ?? 0
      let w = bounds["Width"] ?? 0
      let h = bounds["Height"] ?? 0
      guard w >= 150, w <= 800, h >= 100, h <= 400, y < 700 else { continue }
      found = true
      left = min(left, x)
      right = max(right, x + w)
      bottom = max(bottom, y + h)
    }
    guard found else { return nsRect(fromTopLeft: fallback) }
    let cg = CGRect(x: left, y: bottom, width: max(right - left, GlanceMetrics.width), height: GlanceMetrics.height)
    return nsRect(fromTopLeft: cg)
  }

  private func nsRect(fromTopLeft cg: CGRect) -> NSRect {
    let screen = NSScreen.screens.first { $0.frame.origin == .zero } ?? NSScreen.main
    let height = screen?.frame.height ?? 982
    return NSRect(
      x: cg.origin.x,
      y: height - cg.origin.y - cg.height,
      width: cg.width,
      height: cg.height
    )
  }

  private func shiftDay(by delta: Int) {
    let today = GlanceDay.todayKey()
    let next = GlanceDay.shift(selectedDayKey, by: delta)
    guard next <= today else { return }
    selectDay(next)
  }

  private func selectDay(_ key: String) {
    let today = GlanceDay.todayKey()
    let clamped = key > today ? today : key
    selectedDayKey = clamped
    if clamped == today {
      UserDefaults.standard.removeObject(forKey: dayDefaultsKey)
    } else {
      UserDefaults.standard.set(clamped, forKey: dayDefaultsKey)
    }
    widget.setNextEnabled(clamped < today)
    if let cached = memory[clamped] {
      render(cached)
    } else {
      widget.setDayLabel(GlanceDay.label(clamped), isToday: clamped == today)
      widget.setDailyPlaceholder()
    }
    closeDatePicker()
    refreshNow()
  }

  private func toggleDatePicker() {
    if pickerPanel?.isVisible == true {
      closeDatePicker()
      return
    }
    let panel: NSPanel
    let picker: NSDatePicker
    if let existing = pickerPanel, let existingPicker = self.picker {
      panel = existing
      picker = existingPicker
    } else {
      picker = NSDatePicker()
      picker.datePickerStyle = .clockAndCalendar
      picker.datePickerElements = [.yearMonthDay]
      picker.isBordered = false
      picker.drawsBackground = false
      picker.target = self
      picker.action = #selector(datePicked(_:))
      picker.appearance = NSAppearance(named: .darkAqua)
      picker.sizeToFit()
      let size = picker.fittingSize
      panel = NSPanel(
        contentRect: NSRect(origin: .zero, size: size),
        styleMask: [.borderless, .nonactivatingPanel],
        backing: .buffered,
        defer: false
      )
      panel.level = .popUpMenu
      panel.isFloatingPanel = true
      panel.isOpaque = true
      panel.hasShadow = true
      panel.backgroundColor = GlanceMetrics.ink
      panel.appearance = NSAppearance(named: .darkAqua)
      panel.hidesOnDeactivate = false
      panel.contentView = picker
      self.picker = picker
      self.pickerPanel = panel
    }
    picker.minDate = GlanceDay.date(from: "2024-01-01")
    picker.maxDate = GlanceDay.date(from: GlanceDay.todayKey())
    picker.dateValue = GlanceDay.date(from: selectedDayKey) ?? Date()
    if let anchor = widget.dateClusterScreenRect() {
      let width = panel.frame.width
      let height = panel.frame.height
      var origin = NSPoint(x: anchor.maxX - width, y: anchor.minY - height - 6)
      if let screen = window.screen ?? NSScreen.main, origin.y < screen.visibleFrame.minY {
        origin.y = anchor.maxY + 6
      }
      panel.setFrameOrigin(origin)
    }
    panel.orderFrontRegardless()
    pickerMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
      guard let self, let panel = self.pickerPanel, panel.isVisible else { return event }
      if event.window !== panel && event.window !== self.window {
        self.closeDatePicker()
      }
      return event
    }
  }

  @objc private func datePicked(_ sender: NSDatePicker) {
    selectDay(GlanceDay.key(from: sender.dateValue))
  }

  private func closeDatePicker() {
    pickerPanel?.orderOut(nil)
    if let pickerMonitor {
      NSEvent.removeMonitor(pickerMonitor)
      self.pickerMonitor = nil
    }
  }

  private func refreshNow() {
    if UserDefaults.standard.string(forKey: dayDefaultsKey) == nil {
      selectedDayKey = GlanceDay.todayKey()
      widget.setNextEnabled(false)
    }
    requestSerial += 1
    let serial = requestSerial
    let dayKey = selectedDayKey
    let root = self.root
    let node = self.node
    DispatchQueue.global(qos: .utility).async { [weak self] in
      let result = Self.fetch(root: root, node: node, dayKey: dayKey)
      DispatchQueue.main.async {
        guard let self, serial == self.requestSerial else { return }
        if case .success(let stats) = result, stats.dayKey == dayKey {
          self.memory[stats.dayKey] = stats
          self.saveCache(stats)
          self.render(stats)
        }
      }
    }
  }

  private func render(_ stats: Stats) {
    let today = GlanceDay.todayKey()
    widget.setValues(
      total: format(stats.registered),
      subscribers: format(stats.subscribers),
      plans: stats.plans,
      todayRegistered: format(stats.todayRegistered),
      todayPredictions: format(stats.todayPosts),
      dayLabel: GlanceDay.label(stats.dayKey),
      isToday: stats.dayKey == today
    )
    widget.setNextEnabled(stats.dayKey < today)
  }

  private func format(_ value: Int) -> String {
    numberFormatter.string(from: NSNumber(value: value)) ?? String(value)
  }

  private func loadCache() -> Stats? {
    guard let data = try? Data(contentsOf: cacheURL) else { return nil }
    return try? JSONDecoder().decode(Stats.self, from: data)
  }

  private func saveCache(_ stats: Stats) {
    guard let data = try? JSONEncoder().encode(stats) else { return }
    try? data.write(to: cacheURL, options: .atomic)
  }

  private static func fetch(root: String, node: String, dayKey: String) -> Result<Stats, GlanceError> {
    let tsx = URL(fileURLWithPath: root)
      .appendingPathComponent("node_modules/.bin/tsx").path
    let script = URL(fileURLWithPath: root)
      .appendingPathComponent("scripts/glance-desktop-stats.ts").path
    guard FileManager.default.fileExists(atPath: node) else {
      return .failure(GlanceError("node が見つかりません"))
    }
    guard FileManager.default.fileExists(atPath: tsx), FileManager.default.fileExists(atPath: script) else {
      return .failure(GlanceError("集計スクリプトが見つかりません"))
    }

    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: node)
    proc.arguments = [tsx, script, "--day=\(dayKey)"]
    proc.currentDirectoryURL = URL(fileURLWithPath: "/tmp")
    var env = ProcessInfo.processInfo.environment
    env["PATH"] = "\(URL(fileURLWithPath: node).deletingLastPathComponent().path):/usr/bin:/bin"
    env["UNITERZ_ROOT"] = root
    proc.environment = env

    let out = Pipe()
    let err = Pipe()
    proc.standardOutput = out
    proc.standardError = err
    do {
      try proc.run()
    } catch {
      return .failure(GlanceError(error.localizedDescription))
    }
    let outHandle = out.fileHandleForReading
    let errHandle = err.fileHandleForReading
    let collected = DispatchGroup()
    var data = Data()
    var errData = Data()
    collected.enter()
    DispatchQueue.global(qos: .utility).async {
      data = outHandle.readDataToEndOfFile()
      collected.leave()
    }
    collected.enter()
    DispatchQueue.global(qos: .utility).async {
      errData = errHandle.readDataToEndOfFile()
      collected.leave()
    }
    proc.waitUntilExit()
    collected.wait()
    guard proc.terminationStatus == 0 else {
      let message = String(data: errData, encoding: .utf8)?
        .trimmingCharacters(in: .whitespacesAndNewlines)
      return .failure(GlanceError(message?.isEmpty == false ? message! : "集計に失敗しました"))
    }
    do {
      return .success(try JSONDecoder().decode(Stats.self, from: data))
    } catch {
      return .failure(GlanceError("集計結果を読めませんでした"))
    }
  }
}

private let widgetLevel = NSWindow.Level(rawValue: -2147483601)

private enum GlanceDay {
  private static var calendar: Calendar {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "Asia/Tokyo") ?? .current
    return cal
  }

  static func todayKey(_ now: Date = Date()) -> String {
    let parts = calendar.dateComponents([.year, .month, .day], from: now)
    return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
  }

  static func shift(_ key: String, by days: Int) -> String {
    guard let date = date(from: key), let next = calendar.date(byAdding: .day, value: days, to: date) else {
      return key
    }
    return self.key(from: next)
  }

  static func label(_ key: String) -> String {
    let parts = key.split(separator: "-")
    guard parts.count == 3 else { return key }
    return "\(parts[1])/\(parts[2])"
  }

  static func date(from key: String) -> Date? {
    let fmt = DateFormatter()
    fmt.calendar = calendar
    fmt.timeZone = calendar.timeZone
    fmt.dateFormat = "yyyy-MM-dd"
    return fmt.date(from: key)
  }

  static func key(from date: Date) -> String {
    let parts = calendar.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
  }
}

private enum GlanceMetrics {
  static let width: CGFloat = 360
  static let height: CGFloat = 180
  static let inset: CGFloat = 8
  static let radius: CGFloat = 20
  static let ink = NSColor(srgbRed: 0.031, green: 0.067, blue: 0.086, alpha: 1) // #081116
  static let cyan = NSColor(srgbRed: 0, green: 0.961, blue: 1, alpha: 1) // #00F5FF
}

final class GlanceWidgetView: NSView {
  var onRefresh: (() -> Void)?
  var onResetPosition: (() -> Void)?
  var onQuit: (() -> Void)?
  var onDragged: ((NSPoint) -> Void)?
  var onShiftDay: ((Int) -> Void)?
  var onPickDate: (() -> Void)?

  private let totalValue = GlanceWidgetView.numberField(size: 26, color: .white)
  private let subscribersValue = GlanceWidgetView.numberField(size: 26, color: .white)
  private let todayRegisteredValue = GlanceWidgetView.numberField(size: 26, color: GlanceMetrics.cyan)
  private let todayPredictionsValue = GlanceWidgetView.numberField(size: 26, color: GlanceMetrics.cyan)
  private let planLine = NSTextField(labelWithString: "")
  private let registeredCaption = GlanceWidgetView.caption("今日の登録")
  private let predictionsCaption = GlanceWidgetView.caption("今日の予想数")
  private let dayValue = NSTextField(labelWithString: "")
  private let prevButton = GlanceWidgetView.arrowButton("‹")
  private let nextButton = GlanceWidgetView.arrowButton("›")
  private var dateCluster: NSStackView!
  private var nextEnabled = true

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    wantsLayer = true
    layer?.backgroundColor = NSColor.clear.cgColor

    let shadowHost = NSView()
    shadowHost.wantsLayer = true
    shadowHost.layer?.backgroundColor = GlanceMetrics.ink.cgColor
    shadowHost.layer?.cornerRadius = GlanceMetrics.radius
    shadowHost.layer?.shadowColor = NSColor.black.cgColor
    shadowHost.layer?.shadowOpacity = 0.45
    shadowHost.layer?.shadowRadius = 16
    shadowHost.layer?.shadowOffset = CGSize(width: 0, height: -6)
    shadowHost.translatesAutoresizingMaskIntoConstraints = false
    addSubview(shadowHost)

    let card = NSView()
    card.wantsLayer = true
    card.layer?.backgroundColor = GlanceMetrics.ink.cgColor
    card.layer?.cornerRadius = GlanceMetrics.radius
    card.layer?.cornerCurve = .continuous
    card.layer?.borderWidth = 1
    card.layer?.borderColor = GlanceMetrics.cyan.withAlphaComponent(0.38).cgColor
    card.layer?.masksToBounds = true
    card.translatesAutoresizingMaskIntoConstraints = false
    addSubview(card)

    let edge = NSView()
    edge.wantsLayer = true
    edge.layer?.backgroundColor = GlanceMetrics.cyan.cgColor
    edge.translatesAutoresizingMaskIntoConstraints = false
    card.addSubview(edge)

    let brand = NSTextField(labelWithString: "")
    let brandFont = NSFont.systemFont(ofSize: 11, weight: .bold)
    brand.attributedStringValue = NSAttributedString(
      string: "UNITERZ",
      attributes: [
        .font: brandFont,
        .foregroundColor: GlanceMetrics.cyan,
        .kern: 2.2,
      ]
    )
    brand.translatesAutoresizingMaskIntoConstraints = false

    dayValue.font = .monospacedDigitSystemFont(ofSize: 12, weight: .semibold)
    dayValue.textColor = .white
    dayValue.alignment = .center
    dayValue.translatesAutoresizingMaskIntoConstraints = false

    let dates = NSStackView()
    dates.orientation = .horizontal
    dates.alignment = .centerY
    dates.spacing = 0
    dates.translatesAutoresizingMaskIntoConstraints = false
    dates.addArrangedSubview(prevButton)
    dates.addArrangedSubview(dayValue)
    dates.addArrangedSubview(nextButton)
    dateCluster = dates

    let rule = NSView()
    rule.wantsLayer = true
    rule.layer?.backgroundColor = GlanceMetrics.cyan.withAlphaComponent(0.28).cgColor
    rule.translatesAutoresizingMaskIntoConstraints = false

    let row = NSStackView()
    row.orientation = .horizontal
    row.distribution = .fillEqually
    row.alignment = .centerY
    row.spacing = 0
    row.translatesAutoresizingMaskIntoConstraints = false
    row.addArrangedSubview(column(caption: GlanceWidgetView.caption("総登録"), value: totalValue))
    row.addArrangedSubview(column(caption: GlanceWidgetView.caption("課金"), value: subscribersValue))
    row.addArrangedSubview(column(caption: registeredCaption, value: todayRegisteredValue))
    row.addArrangedSubview(column(caption: predictionsCaption, value: todayPredictionsValue))

    planLine.alignment = .center
    planLine.translatesAutoresizingMaskIntoConstraints = false
    planLine.attributedStringValue = GlanceWidgetView.planLine(PlanCounts())

    card.addSubview(brand)
    card.addSubview(dates)
    card.addSubview(rule)
    card.addSubview(row)
    card.addSubview(planLine)

    NSLayoutConstraint.activate([
      card.leadingAnchor.constraint(equalTo: leadingAnchor, constant: GlanceMetrics.inset),
      card.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -GlanceMetrics.inset),
      card.topAnchor.constraint(equalTo: topAnchor, constant: GlanceMetrics.inset),
      card.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -GlanceMetrics.inset),
      shadowHost.leadingAnchor.constraint(equalTo: card.leadingAnchor),
      shadowHost.trailingAnchor.constraint(equalTo: card.trailingAnchor),
      shadowHost.topAnchor.constraint(equalTo: card.topAnchor),
      shadowHost.bottomAnchor.constraint(equalTo: card.bottomAnchor),

      edge.topAnchor.constraint(equalTo: card.topAnchor),
      edge.leadingAnchor.constraint(equalTo: card.leadingAnchor),
      edge.trailingAnchor.constraint(equalTo: card.trailingAnchor),
      edge.heightAnchor.constraint(equalToConstant: 2),

      brand.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
      brand.topAnchor.constraint(equalTo: edge.bottomAnchor, constant: 12),

      dates.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -10),
      dates.centerYAnchor.constraint(equalTo: brand.centerYAnchor),
      prevButton.widthAnchor.constraint(equalToConstant: 22),
      prevButton.heightAnchor.constraint(equalToConstant: 22),
      nextButton.widthAnchor.constraint(equalToConstant: 22),
      nextButton.heightAnchor.constraint(equalToConstant: 22),
      dayValue.widthAnchor.constraint(greaterThanOrEqualToConstant: 44),

      rule.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
      rule.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
      rule.topAnchor.constraint(equalTo: brand.bottomAnchor, constant: 10),
      rule.heightAnchor.constraint(equalToConstant: 1),

      row.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 6),
      row.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -6),
      row.topAnchor.constraint(equalTo: rule.bottomAnchor, constant: 8),

      planLine.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 10),
      planLine.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -10),
      planLine.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -10),
    ])
  }

  required init?(coder: NSCoder) { nil }

  override func hitTest(_ point: NSPoint) -> NSView? {
    bounds.contains(point) ? self : nil
  }

  override func mouseDown(with event: NSEvent) {
    let local = dateCluster.convert(event.locationInWindow, from: nil)
    if dateCluster.bounds.insetBy(dx: -4, dy: -6).contains(local) {
      let prevFrame = prevButton.convert(prevButton.bounds, to: dateCluster).insetBy(dx: -4, dy: -6)
      let nextFrame = nextButton.convert(nextButton.bounds, to: dateCluster).insetBy(dx: -4, dy: -6)
      let dayFrame = dayValue.convert(dayValue.bounds, to: dateCluster).insetBy(dx: -2, dy: -6)
      if prevFrame.contains(local) {
        onShiftDay?(-1)
        return
      }
      if nextFrame.contains(local), nextEnabled {
        onShiftDay?(1)
        return
      }
      if dayFrame.contains(local) {
        onPickDate?()
        return
      }
      return
    }
    let before = window?.frame.origin ?? .zero
    window?.performDrag(with: event)
    guard let after = window?.frame.origin else { return }
    if hypot(after.x - before.x, after.y - before.y) > 2 {
      onDragged?(after)
    }
  }

  func dateClusterScreenRect() -> NSRect? {
    guard let window else { return nil }
    let inWindow = dateCluster.convert(dateCluster.bounds, to: nil)
    return window.convertToScreen(inWindow)
  }

  func setNextEnabled(_ enabled: Bool) {
    nextEnabled = enabled
    let color = enabled ? GlanceMetrics.cyan : NSColor.white.withAlphaComponent(0.28)
    nextButton.attributedStringValue = GlanceWidgetView.arrowTitle("›", color: color)
  }

  func setDayLabel(_ dayLabel: String, isToday: Bool) {
    dayValue.stringValue = dayLabel
    registeredCaption.stringValue = isToday ? "今日の登録" : "その日の登録"
    predictionsCaption.stringValue = isToday ? "今日の予想数" : "その日の予想数"
  }

  func setDailyPlaceholder() {
    todayRegisteredValue.stringValue = "—"
    todayPredictionsValue.stringValue = "—"
  }

  func setValues(
    total: String,
    subscribers: String,
    plans: PlanCounts,
    todayRegistered: String,
    todayPredictions: String,
    dayLabel: String,
    isToday: Bool
  ) {
    totalValue.stringValue = total
    subscribersValue.stringValue = subscribers
    todayRegisteredValue.stringValue = todayRegistered
    todayPredictionsValue.stringValue = todayPredictions
    planLine.attributedStringValue = GlanceWidgetView.planLine(plans)
    setDayLabel(dayLabel, isToday: isToday)
  }

  override func rightMouseDown(with event: NSEvent) {
    let menu = NSMenu()
    let refresh = NSMenuItem(title: "今すぐ更新", action: #selector(refreshClicked), keyEquivalent: "")
    refresh.target = self
    let reset = NSMenuItem(title: "写真の下に戻す", action: #selector(resetClicked), keyEquivalent: "")
    reset.target = self
    let quit = NSMenuItem(title: "終了", action: #selector(quitClicked), keyEquivalent: "")
    quit.target = self
    menu.addItem(refresh)
    menu.addItem(reset)
    menu.addItem(.separator())
    menu.addItem(quit)
    NSMenu.popUpContextMenu(menu, with: event, for: self)
  }

  @objc private func refreshClicked() { onRefresh?() }
  @objc private func resetClicked() { onResetPosition?() }
  @objc private func quitClicked() { onQuit?() }

  private func column(caption: NSTextField, value: NSTextField) -> NSStackView {
    let stack = NSStackView(views: [value, caption])
    stack.orientation = .vertical
    stack.alignment = .centerX
    stack.spacing = 4
    return stack
  }

  private static func caption(_ title: String) -> NSTextField {
    let label = NSTextField(labelWithString: title)
    label.font = .systemFont(ofSize: 10, weight: .medium)
    label.textColor = NSColor.white.withAlphaComponent(0.78)
    label.alignment = .center
    label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    return label
  }

  private static func arrowButton(_ glyph: String) -> NSTextField {
    let field = NSTextField(labelWithString: "")
    field.attributedStringValue = arrowTitle(glyph, color: GlanceMetrics.cyan)
    field.alignment = .center
    return field
  }

  fileprivate static func planLine(_ plans: PlanCounts) -> NSAttributedString {
    let line = NSMutableAttributedString()
    let nameFont = NSFont.systemFont(ofSize: 11, weight: .semibold)
    let countFont = NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .bold)
    let dim = NSColor.white.withAlphaComponent(0.55)
    func append(name: String, count: Int, gap: Bool) {
      if gap {
        line.append(NSAttributedString(string: "    ", attributes: [.font: nameFont, .foregroundColor: dim]))
      }
      let active = count > 0
      line.append(NSAttributedString(
        string: name + " ",
        attributes: [.font: nameFont, .foregroundColor: active ? NSColor.white : dim]
      ))
      line.append(NSAttributedString(
        string: String(count),
        attributes: [.font: countFont, .foregroundColor: active ? GlanceMetrics.cyan : dim]
      ))
    }
    append(name: "Weekly", count: plans.weekly, gap: false)
    append(name: "Monthly", count: plans.monthly, gap: true)
    append(name: "Season", count: plans.season, gap: true)
    if plans.annual > 0 { append(name: "年額", count: plans.annual, gap: true) }
    if plans.other > 0 { append(name: "その他", count: plans.other, gap: true) }
    return line
  }

  private static func arrowTitle(_ glyph: String, color: NSColor) -> NSAttributedString {
    NSAttributedString(
      string: glyph,
      attributes: [
        .font: NSFont.systemFont(ofSize: 18, weight: .semibold),
        .foregroundColor: color,
      ]
    )
  }

  private static func numberField(size: CGFloat, color: NSColor) -> NSTextField {
    let field = NSTextField(labelWithString: "—")
    field.font = .monospacedDigitSystemFont(ofSize: size, weight: .bold)
    field.textColor = color
    field.alignment = .center
    field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    return field
  }
}

struct GlanceError: Error {
  let message: String
  init(_ message: String) { self.message = message }
}

struct PlanCounts: Codable {
  let weekly: Int
  let monthly: Int
  let season: Int
  let annual: Int
  let other: Int

  init(weekly: Int = 0, monthly: Int = 0, season: Int = 0, annual: Int = 0, other: Int = 0) {
    self.weekly = weekly
    self.monthly = monthly
    self.season = season
    self.annual = annual
    self.other = other
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    weekly = try c.decodeIfPresent(Int.self, forKey: .weekly) ?? 0
    monthly = try c.decodeIfPresent(Int.self, forKey: .monthly) ?? 0
    season = try c.decodeIfPresent(Int.self, forKey: .season) ?? 0
    annual = try c.decodeIfPresent(Int.self, forKey: .annual) ?? 0
    other = try c.decodeIfPresent(Int.self, forKey: .other) ?? 0
  }
}

struct Stats: Codable {
  let registered: Int
  let subscribers: Int
  let plans: PlanCounts
  let todayRegistered: Int
  let todayPredictors: Int
  let todayPosts: Int
  let dayKey: String
  let timezone: String
  let asOf: String

  enum CodingKeys: String, CodingKey {
    case registered, subscribers, plans, todayRegistered, todayPredictors, todayPosts, dayKey, timezone, asOf
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    registered = try c.decode(Int.self, forKey: .registered)
    subscribers = try c.decodeIfPresent(Int.self, forKey: .subscribers) ?? 0
    plans = try c.decodeIfPresent(PlanCounts.self, forKey: .plans) ?? PlanCounts()
    todayRegistered = try c.decodeIfPresent(Int.self, forKey: .todayRegistered) ?? 0
    todayPredictors = try c.decodeIfPresent(Int.self, forKey: .todayPredictors) ?? 0
    todayPosts = try c.decode(Int.self, forKey: .todayPosts)
    dayKey = try c.decode(String.self, forKey: .dayKey)
    timezone = try c.decode(String.self, forKey: .timezone)
    asOf = try c.decode(String.self, forKey: .asOf)
  }
}

let args = CommandLine.arguments
func argValue(_ name: String) -> String? {
  guard let idx = args.firstIndex(of: name), idx + 1 < args.count else { return nil }
  return args[idx + 1]
}

guard let root = argValue("--root"), let node = argValue("--node") else {
  fputs("usage: UniterzGlance --root <repo> --node <node>\n", stderr)
  exit(2)
}

let app = NSApplication.shared
let delegate = GlanceApp(root: root, node: node)
app.delegate = delegate
app.run()
