#if os(iOS)
import SwiftUI

struct CourseDetailView: View {
    let slug: String

    @State private var courseData: CourseWithContent?
    @State private var isEnrolled = false
    @State private var progress: CourseProgress?
    @State private var isLoading = true
    @State private var enrolling = false

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let data = courseData {
                VStack(alignment: .leading, spacing: 20) {
                    // Cover image
                    if let url = data.course.coverImageUrl, let imageUrl = URL(string: url) {
                        AsyncImage(url: imageUrl) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Rectangle().fill(PlantgotchiTheme.green.opacity(0.1))
                        }
                        .frame(height: 200)
                        .clipped()
                        .cornerRadius(12)
                    }

                    // Title + creator
                    Text(data.course.title)
                        .font(PlantgotchiTheme.pixelFont(size: 16))
                        .foregroundColor(PlantgotchiTheme.text)

                    if let creator = data.course.creatorName {
                        Text("\(S.byCreator) \(creator)")
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                    }

                    // Description
                    if let desc = data.course.description {
                        Text(desc)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.8))
                    }

                    // Enroll / Continue button
                    enrollButton(course: data.course)

                    // Course content outline
                    VStack(alignment: .leading, spacing: 12) {
                        Text(S.courseContent)
                            .font(PlantgotchiTheme.pixelFont(size: 9))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

                        ForEach(data.phases) { phaseData in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(phaseData.phase.title)
                                    .font(PlantgotchiTheme.bodyFont.weight(.semibold))
                                    .foregroundColor(PlantgotchiTheme.text)

                                ForEach(phaseData.modules) { moduleData in
                                    HStack(spacing: 8) {
                                        Image(systemName: "circle")
                                            .font(.system(size: 6))
                                            .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                                        Text(moduleData.module.title)
                                            .font(PlantgotchiTheme.captionFont)
                                            .foregroundColor(PlantgotchiTheme.text.opacity(0.7))
                                        if moduleData.module.isPreview == 1 {
                                            Text(S.previewLabel)
                                                .font(.system(size: 8, weight: .medium))
                                                .foregroundColor(PlantgotchiTheme.blue)
                                                .padding(.horizontal, 4)
                                                .padding(.vertical, 1)
                                                .background(PlantgotchiTheme.blue.opacity(0.1))
                                                .cornerRadius(3)
                                        }
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .plantgotchiCard()
                }
                .padding()
            }
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadCourse() }
        .onAppear {
            Analytics.track("screen_viewed", properties: ["screen_name": "course_detail", "course_slug": slug])
        }
    }

    @ViewBuilder
    private func enrollButton(course: Course) -> some View {
        if isEnrolled, let data = courseData {
            NavigationLink(destination: CourseLearnerView(slug: slug, courseData: data)) {
                HStack {
                    Image(systemName: "play.fill")
                    Text(S.continueLearning)
                    if let p = progress {
                        Spacer()
                        Text("\(Int(Double(p.completedModules) / max(1, Double(p.totalModules)) * 100))%")
                    }
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(PlantgotchiTheme.green)
                .cornerRadius(10)
            }
        } else {
            Button {
                Task { await enroll() }
            } label: {
                Text(course.priceCents == 0 ? S.enrollFree : S.enrollPrice(formatPrice(course.priceCents, course.currency)))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(enrolling ? PlantgotchiTheme.text.opacity(0.3) : PlantgotchiTheme.green)
                    .cornerRadius(10)
            }
            .disabled(enrolling)
        }
    }

    @MainActor
    private func loadCourse() async {
        do {
            courseData = try await TursoSync.shared.fetchCourseDetail(slug: slug)
            // Check enrollment
            progress = try? await TursoSync.shared.fetchCourseProgress(slug: slug)
            isEnrolled = progress != nil
        } catch {
            print("[CourseDetailView] Failed: \(error)")
        }
        isLoading = false
    }

    @MainActor
    private func enroll() async {
        enrolling = true
        do {
            _ = try await TursoSync.shared.enrollInCourse(slug: slug)
            isEnrolled = true
            progress = try? await TursoSync.shared.fetchCourseProgress(slug: slug)
            Analytics.track("course_enrolled", properties: ["course_slug": slug])
        } catch {
            print("[CourseDetailView] Enroll failed: \(error)")
        }
        enrolling = false
    }

    private func formatPrice(_ cents: Int, _ currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: Double(cents) / 100.0)) ?? "$\(cents / 100)"
    }
}
#endif
