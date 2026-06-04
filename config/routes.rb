Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots without exceptions, 500 otherwise.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Root route – update this when you add a HomeController
  # root "home#index"

  # root "questions#index"
  resources :questions

  # Tags interface
  resources :tag

  # Exercises interface
  resources :exercises do
    member do
      get 'start'
    end
  end

  # Workspace
  root "workspace#show"

  namespace :api do
    patch "classify_question", to: "classify_questions#update"
  end
end

