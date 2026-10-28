import articles from './content/parent-learning-articles.json';

export type ParentLearningArticle = {
 id:string; category:string; title:string; description:string; time:string; image:string;
 body:string[]; prompt:string; contentMarkdown?:string; relatedSlugs?:string[];
 seoTitle?:string; metaDescription?:string;
};

// Keep the supplied slugs stable for related reading and saved guides.
export const expandedParentArticles:ParentLearningArticle[]=articles.map(article=>({
 id:article.slug,category:article.category,title:article.title,description:article.excerpt,
 time:`${article.readingMinutes} min read`,
 image:article.category==='Supporting Your Daughter'?'/images/star-parent-feedback.webp':article.category==='Coaching and Clubs'?'/images/star-player-individual.webp':'/images/star-player-grass.webp',
 body:[],prompt:'',contentMarkdown:article.contentMarkdown,relatedSlugs:article.relatedSlugs,
 seoTitle:article.seoTitle,metaDescription:article.metaDescription
}));

export function parentLearningCategories(articles:ParentLearningArticle[]){
 return ['All topics',...new Set(articles.map(article=>article.category)),'Saved'];
}
