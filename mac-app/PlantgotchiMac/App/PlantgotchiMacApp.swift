import SwiftUI
import AuthenticationServices
import PlantgotchiCore

enum PlantgotchiMacRoot {
    enum Destination: Equatable {
        case authentication
        case garden
    }

    static func destination(isAuthenticated: Bool) -> Destination {
        isAuthenticated ? .garden : .authentication
    }
}

@main
struct PlantgotchiMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var authService: AuthService
    @StateObject private var authViewModel: MacAuthViewModel
    @StateObject private var menuBarController: MenuBarSceneController

    init() {
        let baseURL = MenuBarSceneController.configuredBaseURL()
        let authService = AuthService(baseURL: baseURL.absoluteString)
        let controller = MenuBarSceneController(
            baseURL: baseURL,
            tokenProvider: { authService.bearerToken },
            onUnauthorized: {
                authService.signOut()
            }
        )

        _authService = StateObject(wrappedValue: authService)
        _authViewModel = StateObject(wrappedValue: MacAuthViewModel(authService: authService))
        _menuBarController = StateObject(wrappedValue: controller)
        AppDelegate.refreshHandler = {
            guard authService.isAuthenticated else {
                controller.clearSnapshot()
                return
            }

            controller.refresh()
        }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarPanelView(
                controller: menuBarController,
                isAuthenticated: authService.isAuthenticated,
                signOut: {
                    authService.signOut()
                    menuBarController.clearSnapshot()
                }
            )
        } label: {
            MenuBarStatusView(
                snapshot: menuBarController.snapshot,
                isAuthenticated: authService.isAuthenticated
            )
        }

        WindowGroup("Garden", id: "garden") {
            Group {
                switch PlantgotchiMacRoot.destination(isAuthenticated: authService.isAuthenticated) {
                case .authentication:
                    MacAuthContainerView(viewModel: authViewModel)
                case .garden:
                    GardenWindowView(snapshot: menuBarController.snapshot ?? fallbackSnapshot)
                }
            }
            .onChange(of: authService.isAuthenticated, initial: true) { _, isAuthenticated in
                if isAuthenticated {
                    menuBarController.refresh()
                } else {
                    menuBarController.clearSnapshot()
                }
            }
        }
        .defaultSize(width: 1100, height: 760)
    }

    private var fallbackSnapshot: GardenSnapshot {
        MenuBarPanelViewModel.makeSnapshot(vitality: .medium, attentionCount: 0)
    }
}

@MainActor
final class MacAuthViewModel: ObservableObject {
    enum Mode {
        case login
        case signUp
    }

    @Published var mode: Mode = .login
    @Published var name = ""
    @Published var email = ""
    @Published var password = ""
    @Published var errorMessage: String?
    @Published private(set) var isLoading = false

    private let authService: AuthService
    private var currentNonce: String?

    init(authService: AuthService) {
        self.authService = authService
    }

    func showLogin() {
        mode = .login
        errorMessage = nil
    }

    func showSignUp() {
        mode = .signUp
        errorMessage = nil
    }

    func signIn() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password"
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            defer { isLoading = false }

            do {
                try await authService.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func signUp() {
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }

        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters"
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            defer { isLoading = false }

            do {
                try await authService.signUp(email: email, password: password, name: name)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = AppleSignInHelper.randomNonceString()
        currentNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = AppleSignInHelper.sha256(nonce)
    }

    func handleAppleCompletion(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credentials = AppleSignInHelper.extractCredentials(
                from: authorization,
                nonce: currentNonce
            ) else {
                errorMessage = "Failed to get Apple credentials"
                return
            }

            isLoading = true
            errorMessage = nil

            Task {
                defer { isLoading = false }

                do {
                    try await authService.signInWithApple(
                        idToken: credentials.idToken,
                        nonce: credentials.nonce
                    )
                } catch {
                    errorMessage = error.localizedDescription
                }
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}

struct MacAuthContainerView: View {
    @ObservedObject var viewModel: MacAuthViewModel

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [MacGardenTheme.panelTop, MacGardenTheme.panelBottom],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Text("Plantgotchi")
                    .font(MacGardenTheme.titleFont)
                    .foregroundStyle(MacGardenTheme.ink)

                Text("Sign in to load your live garden")
                    .font(MacGardenTheme.bodyFont)
                    .foregroundStyle(MacGardenTheme.ink.opacity(0.75))

                switch viewModel.mode {
                case .login:
                    MacLoginView(viewModel: viewModel)
                case .signUp:
                    MacSignUpView(viewModel: viewModel)
                }
            }
            .padding(40)
            .frame(maxWidth: 460)
        }
    }
}

private struct MacLoginView: View {
    @ObservedObject var viewModel: MacAuthViewModel

    var body: some View {
        MacAuthCard(title: "Welcome back") {
            Group {
                LabeledContent("Email") {
                    TextField("you@example.com", text: $viewModel.email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                }

                LabeledContent("Password") {
                    SecureField("Password", text: $viewModel.password)
                        .textFieldStyle(.roundedBorder)
                }
            }
        } footer: {
            Group {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(action: viewModel.signIn) {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Sign In")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading)

                SignInWithAppleButton(.signIn) { request in
                    viewModel.configureAppleRequest(request)
                } onCompletion: { result in
                    viewModel.handleAppleCompletion(result)
                }
                .signInWithAppleButtonStyle(.black)
                .frame(height: 44)

                Button("Need an account? Create one") {
                    viewModel.showSignUp()
                }
                .buttonStyle(.plain)
                .foregroundStyle(MacGardenTheme.leaf)
            }
        }
    }
}

private struct MacSignUpView: View {
    @ObservedObject var viewModel: MacAuthViewModel

    var body: some View {
        MacAuthCard(title: "Create your account") {
            Group {
                LabeledContent("Name") {
                    TextField("Your name", text: $viewModel.name)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.name)
                }

                LabeledContent("Email") {
                    TextField("you@example.com", text: $viewModel.email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                }

                LabeledContent("Password") {
                    SecureField("At least 8 characters", text: $viewModel.password)
                        .textFieldStyle(.roundedBorder)
                }
            }
        } footer: {
            Group {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(action: viewModel.signUp) {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Create Account")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading)

                SignInWithAppleButton(.signUp) { request in
                    viewModel.configureAppleRequest(request)
                } onCompletion: { result in
                    viewModel.handleAppleCompletion(result)
                }
                .signInWithAppleButtonStyle(.black)
                .frame(height: 44)

                Button("Already have an account? Sign in") {
                    viewModel.showLogin()
                }
                .buttonStyle(.plain)
                .foregroundStyle(MacGardenTheme.leaf)
            }
        }
    }
}

private struct MacAuthCard<Content: View, Footer: View>: View {
    let title: String
    @ViewBuilder let content: Content
    @ViewBuilder let footer: Footer

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(title)
                .font(MacGardenTheme.sectionTitleFont)
                .foregroundStyle(MacGardenTheme.ink)

            VStack(alignment: .leading, spacing: 14) {
                content
            }

            VStack(alignment: .leading, spacing: 12) {
                footer
            }
        }
        .padding(24)
        .background(MacGardenTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(MacGardenTheme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.08), radius: 18, x: 0, y: 10)
    }
}
