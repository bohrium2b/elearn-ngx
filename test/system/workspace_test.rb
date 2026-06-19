# frozen_string_literal: true

require "application_system_test_case"

class WorkspaceTest < ApplicationSystemTestCase
  test "dragging an untagged question into a tag updates the workspace" do
    root_tag = create(:tag, name: "Mathematics")
    subtag = create(:tag, name: "Integration", parent: root_tag)
    question = create(:question, question_id_code: "Q-101")

    visit root_path

    assert_text "Hierarchical Tag Workspace"
    assert_selector "[data-testid='tag-drop-zone-#{subtag.id}']"
    within("[data-testid='untagged-question-pool']") do
      assert_selector "[data-testid='question-card-#{question.id}']"
    end

    source = find("[data-testid='question-card-#{question.id}']")
    target = find("[data-testid='tag-drop-zone-#{subtag.id}']")

    source.drag_to(target)

    within("[data-testid='untagged-question-pool']") do
      assert_no_selector "[data-testid='question-card-#{question.id}']"
    end
    assert_text "Q-101"
  end

  test "selecting a question reveals the inline editor" do
    create(:tag, name: "Mathematics")
    question = create(:question, question_id_code: "Q-202")

    visit root_path

    find("[data-testid='question-card-#{question.id}']").click

    assert_selector "[data-testid='question-detail-panel']"
    within("[data-testid='question-detail-panel']") do
      assert_text "Selected Question"
      click_on "Edit"
      assert_selector "[data-testid='question-save-button']"
    end
  end

  test "workspace refreshes when new tags appear" do
    visit root_path

    created_tag = create(:tag, name: "Fresh Tag")

    assert_text created_tag.name, wait: 8
  end
end
