// production đổi testContestModels thành contestModel
const ContestantTest = require("../../models/contestModel");
const Score = require("../../models//scoreModel");
const User = require("../../models/userModel");

// Lấy danh sách tất cả các ContestantTest
exports.getList = async (req, res) => {
  try {
    const contestants = await ContestantTest.find();

    // Tạo một mảng promises để lấy tổng điểm và thông tin judge cho từng contestant
    const contestantsWithScores = await Promise.all(
      contestants.map(async (contestant) => {
        const scores = await Score.find({ contestantId: contestant._id });
        // Lấy thông tin judge cho từng score
        const judges = await Promise.all(
          scores.map(async (score) => {
            // Tìm User dựa trên judgeId từ Score
            const judge = await User.findById(score.judgeId).select(
              "username email fullName"
            );
            return { ...score.toObject(), judge };
          })
        );

        const totalScore = scores.reduce((acc, score) => acc + score.score, 0);

        // Trả về contestant với tổng điểm và thông tin judge
        return {
          ...contestant.toObject(),
          totalScore,
          judges, // Thêm thông tin judge
        };
      })
    );

    return contestantsWithScores;
  } catch (error) {
    return false;
  }
};

// Tìm ContestantTest theo ID
exports.findById = async (req, res) => {
  try {
    const contestant = await ContestantTest.findById(req.params.id);
    if (!contestant) {
      return false;
    }
    return contestant;
  } catch (error) {
    return false;
  }
};
