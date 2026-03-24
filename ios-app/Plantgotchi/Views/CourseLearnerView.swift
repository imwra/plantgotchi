#if os(iOS)
import SwiftUI
import AVKit

struct CourseLearnerView: View {
    let slug: String
    let courseData: CourseWithContent

    @State private var activeModuleId: String?
    @State private var completedModules: Set<String> = []
    @State private var progress: CourseProgress?

    private var allModules: [(PhaseWithModules, ModuleWithBlocks)] {
        courseData.phases.flatMap { p in p.modules.map { (p, $0) } }
    }

    private var activeModule: ModuleWithBlocks? {
        allModules.first { $0.1.id == activeModuleId }?.1
    }

    var body: some View {
        VStack(spacing: 0) {
            // Progress bar
            if let p = progress {
                let pct = p.totalModules > 0 ? Double(p.completedModules) / Double(p.totalModules) : 0
                HStack {
                    Text(S.progress)
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(PlantgotchiTheme.text.opacity(0.1))
                                .frame(height: 6)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(PlantgotchiTheme.green)
                                .frame(width: geo.size.width * pct, height: 6)
                        }
                    }
                    .frame(height: 6)
                    Text("\(Int(pct * 100))%")
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(PlantgotchiTheme.text.opacity(0.03))
            }

            ScrollView {
                if let module = activeModule {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(module.module.title)
                            .font(PlantgotchiTheme.pixelFont(size: 14))
                            .foregroundColor(PlantgotchiTheme.text)

                        ForEach(module.blocks) { block in
                            renderBlock(block)
                        }

                        // Mark complete button (for non-quiz modules)
                        if !completedModules.contains(module.id)
                            && !module.blocks.contains(where: { $0.blockType == "quiz" }) {
                            Button {
                                Task { await completeModule(module.id) }
                            } label: {
                                HStack {
                                    Image(systemName: "checkmark.circle")
                                    Text(S.markComplete)
                                }
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(PlantgotchiTheme.green)
                                .cornerRadius(8)
                            }
                        }

                        if completedModules.contains(module.id) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(PlantgotchiTheme.green)
                                Text(S.completed)
                                    .foregroundColor(PlantgotchiTheme.green)
                            }
                            .font(PlantgotchiTheme.bodyFont)

                            // Next module button
                            if let next = nextModule(after: module.id) {
                                Button {
                                    activeModuleId = next.id
                                } label: {
                                    HStack {
                                        Text(S.nextModule)
                                        Image(systemName: "arrow.right")
                                    }
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(PlantgotchiTheme.blue)
                                }
                            }
                        }
                    }
                    .padding()
                }
            }

            // Module navigation drawer
            moduleNavBar
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationTitle(courseData.course.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if activeModuleId == nil, let first = allModules.first {
                activeModuleId = first.1.id
            }
            await loadProgress()
        }
        .onAppear {
            Analytics.track("screen_viewed", properties: ["screen_name": "course_learner", "course_slug": slug])
        }
    }

    // MARK: - Block Rendering

    @ViewBuilder
    private func renderBlock(_ block: ContentBlock) -> some View {
        switch block.blockType {
        case "video":
            if let data = block.content.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let urlStr = json["url"] as? String, let url = URL(string: urlStr) {
                VideoPlayer(player: AVPlayer(url: url))
                    .frame(height: 220)
                    .cornerRadius(8)
            }
        case "text":
            Text(block.content)
                .font(PlantgotchiTheme.bodyFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.85))
        case "quiz":
            QuizBlockView(content: block.content) { answers in
                Task { await completeModule(block.moduleId, quizAnswers: answers) }
            }
            .plantgotchiCard()
        default:
            Text(block.content)
                .font(PlantgotchiTheme.bodyFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.7))
        }
    }

    // MARK: - Module Nav

    private var moduleNavBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(allModules, id: \.1.id) { _, moduleData in
                    Button {
                        activeModuleId = moduleData.id
                    } label: {
                        HStack(spacing: 4) {
                            if completedModules.contains(moduleData.id) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(PlantgotchiTheme.green)
                                    .font(.caption2)
                            }
                            Text(moduleData.module.title)
                                .font(.caption2)
                                .lineLimit(1)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            activeModuleId == moduleData.id
                                ? PlantgotchiTheme.green.opacity(0.15)
                                : PlantgotchiTheme.text.opacity(0.05)
                        )
                        .foregroundColor(
                            activeModuleId == moduleData.id
                                ? PlantgotchiTheme.green
                                : PlantgotchiTheme.text.opacity(0.6)
                        )
                        .cornerRadius(14)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(PlantgotchiTheme.text.opacity(0.03))
    }

    // MARK: - Actions

    @MainActor
    private func completeModule(_ moduleId: String, quizAnswers: String? = nil) async {
        do {
            try await TursoSync.shared.completeModule(slug: slug, moduleId: moduleId, quizAnswers: quizAnswers)
            completedModules.insert(moduleId)
            await loadProgress()
            Analytics.track("course_lesson_completed", properties: ["course_slug": slug, "module_id": moduleId])
        } catch {
            print("[CourseLearnerView] Complete failed: \(error)")
        }
    }

    @MainActor
    private func loadProgress() async {
        progress = try? await TursoSync.shared.fetchCourseProgress(slug: slug)
    }

    private func nextModule(after moduleId: String) -> ModuleWithBlocks? {
        let all = allModules
        guard let idx = all.firstIndex(where: { $0.1.id == moduleId }),
              idx + 1 < all.count else { return nil }
        return all[idx + 1].1
    }
}
#endif
