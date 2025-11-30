# Database Relationship Analysis

## Categories

- Students
- Classes
- Homework

## Relationships

**Students → Classes**: `many-to-many` (high confidence)
   - Students can enroll in multiple classes, and each class can have multiple students.

**Classes → Students**: `many-to-many` (high confidence)
   - Classes can have multiple students, and students can enroll in multiple classes. This is the inverse of the relationship above.

**Students → Homework**: `one-to-many` (high confidence)
   - A student can have many homework assignments.

**Homework → Students**: `many-to-one` (high confidence)
   - Each homework assignment is typically assigned to one student.

**Classes → Homework**: `one-to-many` (high confidence)
   - A class can have many homework assignments.

**Homework → Classes**: `many-to-one` (high confidence)
   - Each homework assignment is associated with one class.

