// Utility script to update populate calls
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Document\\mytodo upgrated backend version\\Air_task_backend\\controllers\\taskController.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace patterns
const replacements = [
  { old: '.populate("createdBy", "name avatar rating")', new: '.populate("createdBy", "firstName lastName avatar rating")' },
  { old: '.populate("assignedTo", "name avatar rating")', new: '.populate("assignedTo", "firstName lastName avatar rating")' },
  { old: '.populate("offers.user", "name avatar rating")', new: '.populate("offers.user", "firstName lastName avatar rating")' },
  { old: '.populate("createdBy", "name avatar")', new: '.populate("createdBy", "firstName lastName avatar")' },
  { old: '.populate("assignedTo", "name avatar")', new: '.populate("assignedTo", "firstName lastName avatar")' },
  { old: ').populate("createdBy assignedTo", "name avatar rating");', new: ').populate("createdBy assignedTo", "firstName lastName avatar rating");' },
  { old: ').populate("createdBy assignedTo", "name avatar");', new: ').populate("createdBy assignedTo", "firstName lastName avatar");' }
];

let updatedContent = content;
let changesMade = 0;

replacements.forEach((replacement, index) => {
  const matches = (updatedContent.match(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (matches > 0) {
    updatedContent = updatedContent.replace(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.new);
    console.log(`Replacement ${index + 1}: Updated ${matches} occurrences of "${replacement.old}"`);
    changesMade += matches;
  }
});

if (changesMade > 0) {
  fs.writeFileSync(filePath, updatedContent);
  console.log(`Total changes made: ${changesMade}`);
  console.log('File updated successfully!');
} else {
  console.log('No changes needed.');
}
