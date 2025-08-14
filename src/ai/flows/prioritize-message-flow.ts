/**
 * @fileOverview An AI agent that analyzes a user's profile and determines the most important message to show them.
 *
 * - prioritizeMessage - A function that handles the message prioritization process.
 * - PrioritizeMessageInput - The input type for the prioritizeMessage function.
 * - PrioritizeMessageOutput - The return type for the prioritizeMessage function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { PrioritizeMessageInputSchema, PrioritizeMessageOutputSchema, PrioritizeMessageInput, PrioritizeMessageOutput } from '@/lib/types';
import { z } from 'zod';

const prompt = ai.definePrompt({
  name: 'prioritizeMessagePrompt',
  input: { schema: PrioritizeMessageInputSchema },
  output: { schema: PrioritizeMessageOutputSchema },
  prompt: `You are an expert user engagement strategist for a staking platform.
    Your task is to analyze a user's current status and determine the single most impactful message to show them to encourage a specific action.

    Analyze the user's data below. All announcements from the admin are highest priority. If there are multiple admin announcements, show the newest one.
    If there are no admin announcements, evaluate the user's proximity to their next level-up or team reward and formulate an encouraging message about their "Next Best Action".
    If there are no pressing actions, provide a generic welcome or tip.

    User Data:
    - Balance: {{{user.balance}}} USDT
    - Level: {{{user.level}}}
    - Next Level Requirements: Min Balance: {{{nextLevel.minBalance}}}, Min Referrals: {{{nextLevel.directReferrals}}}
    - Team Size: {{{user.teamSize}}}
    - Team Business: {{{user.teamBusiness}}}
    - Active Admin Announcements (show newest first):
    {{#each user.announcements}}
    - "{{this.message}}" (Sent: {{this.createdAt}})
    {{/each}}
    - Next Team Size Reward: {{{nextTeamSizeReward.teamSize}}} members for {{{nextTeamSizeReward.rewardAmount}}} USDT
    - Next Team Business Reward: {{{nextTeamBusinessReward.businessAmount}}} USDT for {{{nextTeamBusinessReward.rewardAmount}}} USDT

    Your response must be in the specified JSON format.
    - Set 'source' to 'admin' if you are showing an admin announcement, otherwise set it to 'ai'.
    - 'message' should be concise, encouraging, and clear.
    - If suggesting an action, be specific (e.g., "You are only 2 referrals away from Gold Level!").
  `,
});


const prioritizeMessageFlow = ai.defineFlow(
  {
    name: 'prioritizeMessageFlow',
    inputSchema: PrioritizeMessageInputSchema,
    outputSchema: PrioritizeMessageOutputSchema,
  },
  async (input) => {
    // If there's an unread admin announcement, it's the highest priority.
    const unreadAdminAnnouncements = (input.user.announcements || [])
        .filter(a => a.createdBy === 'admin' && !a.read)
        .sort((a, b) => b.createdAt - a.createdAt);

    if (unreadAdminAnnouncements.length > 0) {
        return {
            source: 'admin',
            message: unreadAdminAnnouncements[0].message,
            announcementId: unreadAdminAnnouncements[0].id
        };
    }

    const { output } = await prompt(input);
    return output!;
  }
);


// Exported wrapper function
export async function prioritizeMessage(input: PrioritizeMessageInput): Promise<PrioritizeMessageOutput> {
  return prioritizeMessageFlow(input);
}
