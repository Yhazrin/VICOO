import React, { useState, useMemo } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoModal } from '../components/NeoModal';

// 模板变量定义
export const TEMPLATE_VARIABLES = [
  { variable: '{{date}}', description: '当前日期 (YYYY-MM-DD)', example: '2024-01-15' },
  { variable: '{{time}}', description: '当前时间 (HH:MM)', example: '14:30' },
  { variable: '{{datetime}}', description: '完整日期时间', example: '2024-01-15 14:30' },
  { variable: '{{year}}', description: '当前年份', example: '2024' },
  { variable: '{{month}}', description: '当前月份', example: '01' },
  { variable: '{{day}}', description: '当前日期', example: '15' },
  { variable: '{{weekday}}', description: '星期几', example: 'Monday' },
  { variable: '{{project}}', description: '项目名称', example: 'My Project' },
  { variable: '{{author}}', description: '作者名称', example: 'Your Name' },
  { variable: '{{tags}}', description: '标签列表', example: 'work, important' },
];

// 内置模板（带变量）
const DEFAULT_TEMPLATES = [
  { 
    title: 'Meeting Notes', 
    icon: 'groups', 
    desc: 'Action items, attendees, and key decisions.', 
    color: 'bg-secondary',
    content: `# Meeting Notes - {{date}}

## Attendees
- 

## Agenda
1. 

## Discussion Points


## Action Items
- [ ] 

## Next Steps

---
*Notes taken by {{author}}*`
  },
  { 
    title: 'Code Snippet', 
    icon: 'code', 
    desc: 'Language, dependencies, and usage examples.', 
    color: 'bg-info',
    content: `# {{title}}

## Language
\`\`\`
language: javascript
\`\`\`

## Code
\`\`\`javascript
// Your code here
\`\`\`

## Explanation


## Usage
\`\`\`javascript
// Example usage
\`\`\`

## Tags
{{tags}}`
  },
  { 
    title: 'Design Review', 
    icon: 'palette', 
    desc: 'Feedback grid, screenshots, and next steps.', 
    color: 'bg-accent',
    content: `# Design Review - {{project}}

## Overview


## Screenshots


## Feedback
| Aspect | Rating | Comments |
|--------|--------|----------|
| Usability | ⭐⭐⭐⭐⭐ | |
| Aesthetics | ⭐⭐⭐⭐ | |
| Performance | ⭐⭐⭐⭐⭐ | |

## Next Steps
- [ ] 

---
Reviewed on {{date}} by {{author}}`
  },
  { 
    title: 'Daily Journal', 
    icon: 'edit', 
    desc: 'Morning intention, gratitude, and evening reflection.', 
    color: 'bg-primary',
    content: `# Journal - {{date}}

## Morning Intention
What do I want to accomplish today?


## Gratitude
I am grateful for:


## Evening Reflection
What went well today?


What could have been better?


## Tomorrow's Focus

---
*Entry by {{author}}*`
  },
  { 
    title: 'Project Spec', 
    icon: 'rocket_launch', 
    desc: 'Goals, scope, risks, and timeline.', 
    color: 'bg-gray-100',
    content: `# Project: {{project}}

## Overview


## Goals
1. 

## Scope
### In Scope
- 

### Out of Scope
- 

## Timeline
| Phase | Date | Deliverable |
|-------|------|-------------|
| Planning | | |
| Development | | |
| Testing | | |
| Launch | | |

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

## Resources


---
*Created on {{datetime}} by {{author}}*`
  },
  { 
    title: 'Bug Report', 
    icon: 'bug_report', 
    desc: 'Reproduction steps, environment, and logs.', 
    color: 'bg-red-100',
    content: `# Bug Report - {{title}}

## Summary


## Severity
- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low

## Environment
- OS: 
- Browser: 
- Version: 

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior


## Actual Behavior


## Logs
\`\`\`
// Paste logs here
\`\`\`

## Possible Fix


---
*Reported on {{datetime}}*`
  },
  { 
    title: 'Weekly Review', 
    icon: 'date_range', 
    desc: 'Review your week and plan ahead.', 
    color: 'bg-primary',
    content: `# Weekly Review - Week of {{date}}

## Accomplishments
- 


## Challenges Faced


## Lessons Learned


## Next Week Goals
- [ ] 
- [ ] 
- [ ] 

## Notes


---
*Reviewed by {{author}}*`
  },
];

interface Template {
  title: string;
  icon: string;
  desc: string;
  color: string;
  content?: string;
}

export const Templates: React.FC = () => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Work', 'Personal', 'Code', 'System'];

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    return DEFAULT_TEMPLATES.filter(t => {
      const matchesCategory = selectedCategory === 'All' || t.desc.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // 应用模板变量
  const applyTemplate = (template: Template) => {
    let content = template.content || '';
    const now = new Date();
    
    content = content
      .replace(/\{\{date\}\}/g, now.toISOString().split('T')[0])
      .replace(/\{\{time\}\}/g, now.toTimeString().slice(0, 5))
      .replace(/\{\{datetime\}\}/g, now.toLocaleString())
      .replace(/\{\{year\}\}/g, now.getFullYear().toString())
      .replace(/\{\{month\}\}/g, String(now.getMonth() + 1).padStart(2, '0'))
      .replace(/\{\{day\}\}/g, String(now.getDate()).padStart(2, '0'))
      .replace(/\{\{weekday\}\}/g, now.toLocaleDateString('en-US', { weekday: 'long' }))
      .replace(/\{\{project\}\}/g, 'My Project')
      .replace(/\{\{author\}\}/g, 'User')
      .replace(/\{\{tags\}\}/g, '');

    // 复制到剪贴板
    navigator.clipboard.writeText(content);
    alert('Template copied to clipboard! Paste it in your note.');
  };

  const handleSaveTemplate = () => {
      setIsCreatorOpen(false);
      setNewTemplateName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">Template Hub</h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Standardize your input for better output.</p>
         </div>
         <div className="flex gap-2">
            <NeoButton variant="secondary" onClick={() => setIsVariablesOpen(true)}>
               <span className="material-icons-round mr-2">code</span> Variables
            </NeoButton>
            <NeoButton variant="primary" onClick={() => setIsCreatorOpen(true)}>
               <span className="material-icons-round mr-2">add</span> Create Custom
            </NeoButton>
         </div>
      </header>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search templates..."
               className="w-full pl-10 pr-4 py-3 border-3 border-ink dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-white rounded-xl font-bold focus:ring-0"
            />
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
               <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                     selectedCategory === cat 
                     ? 'bg-primary text-ink border-2 border-ink' 
                     : 'bg-white dark:bg-gray-800 text-ink dark:text-white border-2 border-ink dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
               >
                  {cat}
               </button>
            ))}
         </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredTemplates.map((template, idx) => (
            <div 
               key={idx}
               className="bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-600 rounded-2xl shadow-neo-sm hover:shadow-neo-md transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden"
               onClick={() => applyTemplate(template)}
            >
               <div className={`h-2 ${template.color}`}></div>
               <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                     <div className={`w-12 h-12 ${template.color} border-2 border-ink dark:border-gray-600 rounded-xl flex items-center justify-center shadow-neo-sm`}>
                        <span className="material-icons-round text-2xl text-ink">{template.icon}</span>
                     </div>
                     <div className="flex-1">
                        <h3 className="font-display font-bold text-lg text-ink dark:text-white group-hover:text-primary transition-colors">
                           {template.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.desc}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <span className="material-icons-round text-sm">content_copy</span>
                        Click to copy
                     </span>
                     <NeoButton size="sm" variant="secondary">
                        Use
                     </NeoButton>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {filteredTemplates.length === 0 && (
         <div className="text-center py-12">
            <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
            <p className="text-gray-500 dark:text-gray-400 font-bold">No templates found</p>
         </div>
      )}

      {/* Variables Help Modal */}
      <NeoModal
        isOpen={isVariablesOpen}
        onClose={() => setIsVariablesOpen(false)}
        title="Template Variables"
        icon="code"
      >
         <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
               Use these variables in your templates. They will be automatically replaced when you apply the template.
            </p>
            {TEMPLATE_VARIABLES.map(v => (
               <div key={v.variable} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <code className="font-mono text-primary font-bold">{v.variable}</code>
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{v.description}</span>
                  <span className="text-xs text-gray-400">e.g. {v.example}</span>
               </div>
            ))}
         </div>
      </NeoModal>

      {/* TEMPLATE CREATOR MODAL */}
      <NeoModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        title="New Mindframe"
        icon="extension"
        footer={
            <>
                <NeoButton variant="secondary" onClick={() => setIsCreatorOpen(false)}>Cancel</NeoButton>
                <NeoButton onClick={handleSaveTemplate}>Save Template</NeoButton>
            </>
        }
      >
          <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold mb-2">Template Name</label>
                  <input 
                    type="text" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Weekly Retrospective" 
                    className="w-full border-3 border-ink dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-white rounded-xl px-4 py-3 font-bold focus:ring-0" 
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold mb-2">Category / Tag</label>
                  <div className="flex gap-2">
                      {['Work', 'Personal', 'Code', 'System'].map(tag => (
                          <button key={tag} className="border-2 border-ink dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-primary dark:focus:bg-primary dark:focus:text-ink">
                              {tag}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold mb-2">Structure (Markdown)</label>
                  <div className="relative">
                    <textarea 
                        className="w-full h-48 border-3 border-ink dark:border-gray-600 rounded-xl p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:ring-0 resize-none"
                        placeholder="# Goal&#10;&#10;## Key Results&#10;- [ ] ...&#10;&#10;## Blockers"
                    ></textarea>
                    <div className="absolute top-2 right-2">
                        <button className="text-xs font-bold bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 text-ink dark:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">Insert Variable</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold">Supported: {"{{date}}"}, {"{{time}}"}, {"{{clipboard}}"}</p>
              </div>
          </div>
      </NeoModal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {templates.map((tpl, i) => (
            <NeoCard key={i} className="p-6 cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-20 h-20 ${tpl.color} rounded-bl-full border-l-3 border-b-3 border-ink opacity-20 group-hover:opacity-100 transition-opacity -mr-4 -mt-4`}></div>
               
               <div className={`w-14 h-14 ${tpl.color} border-3 border-ink dark:border-gray-500 rounded-xl flex items-center justify-center shadow-neo-sm mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-icons-round text-3xl text-ink">{tpl.icon}</span>
               </div>
               
               <h3 className="text-xl font-bold mb-2">{tpl.title}</h3>
               <p className="text-gray-600 dark:text-gray-300 font-medium text-sm mb-6 min-h-[40px]">{tpl.desc}</p>
               
               <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-ink dark:group-hover:text-white transition-colors">
                  <span>Use Template</span>
                  <span className="material-icons-round text-base">arrow_forward</span>
               </div>
            </NeoCard>
         ))}
         
         <div className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 hover:text-ink dark:hover:text-white hover:border-ink dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer min-h-[200px] group">
             <span className="material-icons-round text-4xl mb-2">upload_file</span>
             <span className="font-bold">Import from Markdown</span>
         </div>
      </div>
    </div>
  );
};