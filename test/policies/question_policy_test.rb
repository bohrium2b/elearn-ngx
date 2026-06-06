require "test_helper"

class QuestionPolicyTest < ActiveSupport::TestCase
  def setup
    @student = create(:user, :student)
    @content_author = create(:user, :content_author)
    @instructor = create(:user, :instructor)
    @admin = create(:user, :admin)
    @question = create(:question)
  end

  def test_index
    assert QuestionPolicy.new(nil, @question).index?
    assert QuestionPolicy.new(@student, @question).index?
  end

  def test_show
    assert QuestionPolicy.new(nil, @question).show?
    assert QuestionPolicy.new(@student, @question).show?
  end

  def test_create
    assert_not QuestionPolicy.new(@student, @question).create?
    assert QuestionPolicy.new(@content_author, @question).create?
    # Instructor does not have create permission in QuestionPolicy
    assert_not QuestionPolicy.new(@instructor, @question).create?
    assert QuestionPolicy.new(@admin, @question).create?
  end

  def test_update
    assert_not QuestionPolicy.new(@student, @question).update?
    assert QuestionPolicy.new(@content_author, @question).update?
    # Instructor does not have update permission in QuestionPolicy
    assert_not QuestionPolicy.new(@instructor, @question).update?
    assert QuestionPolicy.new(@admin, @question).update?
  end

  def test_destroy
    assert_not QuestionPolicy.new(@student, @question).destroy?
    assert QuestionPolicy.new(@content_author, @question).destroy?
    # Instructor does not have destroy permission in QuestionPolicy
    assert_not QuestionPolicy.new(@instructor, @question).destroy?
    assert QuestionPolicy.new(@admin, @question).destroy?
  end
end
