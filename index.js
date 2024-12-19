const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/leetcode-profile', async (req, res) => {
  try {
    const { username } = req.body;

    // Fetch user's profile and submission stats
    const profileResponse = await axios.post('https://leetcode.com/graphql/', {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            languageProblemCount {
              languageName
              problemsSolved
            }
          }
        }
      `,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': `https://leetcode.com/u/${username}/`
      }
    });

    // Fetch recent submissions
    const recentSubmissionsResponse = await axios.post('https://leetcode.com/graphql/', {
      operationName: "recentAcSubmissions",
      query: `
        query recentAcSubmissions($username: String!, $limit: Int!) {
          recentAcSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            timestamp
          }
        }
      `,
      variables: { 
        username: username,
        limit: 3 
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': `https://leetcode.com/u/${username}/`
      }
    });

    // Fetch streak information (this might require authentication)
    const streakResponse = await axios.post('https://leetcode.com/graphql/', {
      operationName: "getStreakCounter",
      query: `
        query getStreakCounter {
          streakCounter {
            streakCount
            daysSkipped
            currentDayCompleted
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': `https://leetcode.com/u/${username}/`
      }
    });

    // Combine the responses
    const combinedResponse = {
      ...profileResponse.data,
      recentSubmissions: recentSubmissionsResponse.data.data.recentAcSubmissionList,
      streakInfo: streakResponse.data.data.streakCounter?.currentDayCompleted
    };

    res.json(combinedResponse);
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});