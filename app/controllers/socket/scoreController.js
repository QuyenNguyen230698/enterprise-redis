const Score = require("../../models/scoreModel");

// Hàm để tạo hoặc cập nhật điểm
async function createOrUpdateScore(data) {
  try {
   
    const {
      contestantId,
      judgeId,
      score,
      creativeScore,
      aestheticScore,
      storytellingScore,
    } = data;

    // Tìm kiếm điểm đã tồn tại
    let existingScore = await Score.findOne({ contestantId, judgeId });

    if (existingScore) {
      // Cập nhật điểm nếu đã tồn tại
      existingScore.score = score;
      existingScore.creativeScore = creativeScore;
      existingScore.aestheticScore = aestheticScore;
      existingScore.storytellingScore = storytellingScore;
      await existingScore.save();
    } else {
      // Tạo mới điểm nếu chưa tồn tại
      const newScore = new Score({
        contestantId,
        judgeId,
        score,
        creativeScore,
        aestheticScore,
        storytellingScore,
      });
      await newScore.save();
    }

    return { success: true, message: "Score processed successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Lấy danh sách bài đã chấm điểm với tên người dùng và tên cuộc thi
async function getScoredList(currentContestId) {
  try {
    const scores = await Score.find({ contestantId: currentContestId })
      .populate({
        path: "judgeId",
        model: "User",
        select: "username email fullName", // Thêm các trường khác từ bảng User
      })
      .populate({
        path: "contestantId",
        model: "ContestantTest",
        select:
          "authorType title name mainNumberCitizenID mainIssueDateCitizenID mainIssueByCitizenID member1 member1NumberCitizenID member1IssueDateCitizenID member1IssueByCitizenID member2 member2NumberCitizenID member2IssueDateCitizenID member2IssueByCitizenID member3 member3NumberCitizenID member3IssueDateCitizenID member3IssueByCitizenID urlImageMember3 phone email contestantType major university message attach agreedToPolicy idContest aliasName", // Lấy tất cả các trường từ bảng ContestantTest
      })
      .select("score creativeScore aestheticScore storytellingScore createdAt updatedAt"); // Lấy thêm các trường từ bảng Score

    // Định dạng lại dữ liệu
    const formattedScores = scores.reduce((acc, score) => {
      const contestantId = score.contestantId._id.toString();
      const judgeInfo = {
        judgeId: score.judgeId._id,
        email: score.judgeId.email,
        username: score.judgeId.username,
        fullName: score.judgeId.fullName, // Thêm thông tin fullName
        score: score.score,
        creativeScore: score.creativeScore,
        aestheticScore: score.aestheticScore,
        storytellingScore: score.storytellingScore
      };
      const data = score.contestantId
      if (!acc[contestantId]) {
        acc[contestantId] = {
          data,
          judges: []
        };
      }

      acc[contestantId].judges.push(judgeInfo);
      return acc;
    }, {});

    return Object.values(formattedScores);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  createOrUpdateScore,
  getScoredList,
};
