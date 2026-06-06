Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations",
    passwords: "users/passwords"
  }

  # Reveal health status on /up that returns 200 if the app boots without exceptions, 500 otherwise.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Public routes
  resources :questions
  resources :exercises do
    member do
      get "start"
    end
  end
  resources :tag

  # Admin routes
  namespace :admin do
    resources :users
  end

  # Analytics routes
  resources :analytics, only: [:index] do
    collection do
      get :performance_logs
    end
  end

  # API routes
  namespace :api do
    patch "classify_question", to: "classify_questions#update"
  end

  # Root
  root "home#index"

  # Workspace
  get "workspace", to: "workspace#show"
  patch "workspace", to: "workspace#update"
end
