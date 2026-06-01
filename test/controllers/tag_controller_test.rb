require "test_helper"

class TagControllerTest < ActionDispatch::IntegrationTest
  test "shows tags via canonical uuid and slug permalink" do
    tag = create(:tag, name: "Calculus")

    get "/tag/#{tag.to_param}"

    assert_response :success
    assert_includes response.body, "Calculus"
    assert_includes response.body, tag.color
  end

  test "creates a child tag from json" do
    parent = create(:tag, name: "Physics")

    get root_path
    csrf_token = response.body[/meta name="csrf-token" content="([^"]+)"/, 1]

    post "/tag",
         params: {
           tag: {
             name: "Mechanics",
             color: "",
             parent_id: parent.id
           }
         },
         env: {
           "HTTP_X_CSRF_TOKEN" => csrf_token
         },
         as: :json

    assert_response :created
    assert_equal "success", response.parsed_body["status"]
    assert_equal parent.id, Tag.find(response.parsed_body["tag"]["id"]).parent_id
  end

  test "updates a tag from json" do
    tag = create(:tag, name: "Linear Algebra")

    get root_path
    csrf_token = response.body[/meta name="csrf-token" content="([^"]+)"/, 1]

    patch tag_path(tag),
          params: {
            tag: {
              name: "Linear Algebra II",
              color: "#123456"
            }
          },
          env: {
            "HTTP_X_CSRF_TOKEN" => csrf_token
          },
          as: :json

    assert_response :success
    tag.reload
    assert_equal "Linear Algebra II", tag.name
    assert_equal "#123456", tag.color
  end

  test "destroys tags and redirects back to workspace" do
    tag = create(:tag, name: "Topology")
    question = create(:question)
    tag.questions << question

    delete tag_path(tag)

    assert_redirected_to root_path
    assert_not Tag.exists?(tag.id)
    assert_empty question.reload.tags
  end
end
