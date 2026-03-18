#if os(iOS)
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject private var authService: AuthService
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSignUp = false
    @State private var currentNonce: String?

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Logo
                        Text("\u{1F331}")
                            .font(.system(size: 64))
                            .padding(.top, 60)
                        Text("Plantgotchi")
                            .font(PlantgotchiTheme.pixelFont(size: 24))
                            .foregroundColor(PlantgotchiTheme.text)

                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                            TextField("you@example.com", text: $email)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                        }
                        .padding(.horizontal, 24)

                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                            SecureField("Password", text: $password)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(.password)
                        }
                        .padding(.horizontal, 24)

                        // Error message
                        if let errorMessage {
                            Text(errorMessage)
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(.red)
                                .padding(.horizontal, 24)
                        }

                        // Sign in button
                        Button(action: signIn) {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .font(PlantgotchiTheme.pixelFont(size: 14))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(PlantgotchiTheme.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 24)
                        .disabled(isLoading)

                        // Divider
                        HStack {
                            Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                            Text("or")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                            Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                        }
                        .padding(.horizontal, 24)

                        // Sign in with Apple
                        SignInWithAppleButton(.signIn) { request in
                            let nonce = AppleSignInHelper.randomNonceString()
                            currentNonce = nonce
                            request.requestedScopes = [.fullName, .email]
                            request.nonce = AppleSignInHelper.sha256(nonce)
                        } onCompletion: { result in
                            handleAppleSignIn(result)
                        }
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 48)
                        .cornerRadius(12)
                        .padding(.horizontal, 24)

                        // Sign up link
                        Button("Don't have an account? Sign up") {
                            showSignUp = true
                        }
                        .font(PlantgotchiTheme.bodyFont)
                        .foregroundColor(PlantgotchiTheme.green)

                        Spacer()
                    }
                }
            }
            .navigationDestination(isPresented: $showSignUp) {
                SignUpView()
            }
        }
    }

    private func signIn() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password"
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await authService.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
                Analytics.track("auth_login_failed", properties: ["method": "email", "error": error.localizedDescription])
            }
            isLoading = false
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let creds = AppleSignInHelper.extractCredentials(
                from: auth, nonce: currentNonce
            ) else {
                errorMessage = "Failed to get Apple credentials"
                return
            }
            isLoading = true
            errorMessage = nil
            Task {
                do {
                    try await authService.signInWithApple(
                        idToken: creds.idToken, nonce: creds.nonce
                    )
                } catch {
                    errorMessage = error.localizedDescription
                    Analytics.track("auth_login_failed", properties: ["method": "apple", "error": error.localizedDescription])
                }
                isLoading = false
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
            Analytics.track("auth_login_failed", properties: ["method": "apple", "error": error.localizedDescription])
        }
    }
}
#endif
