package com.oemath.resource;

import java.io.ByteArrayInputStream;
import java.sql.Blob;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;

public class Database {

    public static String createUser(User user) { 
        try {
            DBConnect dbConn = new DBConnect();
            PreparedStatement pstmt = dbConn.prepareStatement("insert into user values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            pstmt.setNull(1, Types.BIGINT);
            pstmt.setString(2, user.userName);
            if (user.picture == null || user.picture.length == 0) {
                pstmt.setNull(3,  Types.BLOB);
            }
            else {
                pstmt.setBlob(3, new ByteArrayInputStream(user.picture));
            }
            pstmt.setString(4, user.firstName);
            pstmt.setString(5, user.lastName);
            pstmt.setString(6, user.email);
            pstmt.setString(7, user.salt);
            pstmt.setString(8, user.password);
            pstmt.setInt(9, 0);
            pstmt.setNull(10, Types.DATE);
            pstmt.setNull(11, Types.VARCHAR);
            pstmt.setNull(12, Types.DATE);
            Date currentDate = new Date(System.currentTimeMillis()); 
            pstmt.setDate(13, currentDate);
            pstmt.setDate(14, currentDate);
            pstmt.executeUpdate();
            return "";
        }
        catch (Exception ex) {
            return ex.toString();
        }
    }

    
    public static User lookupByUsernameAndToken(String userName, String token) {

        DBConnect dbConn = new DBConnect();
        String query = "select * from user where lower(user_name) like '" + userName.toLowerCase() + 
                "' and token like '" + token + "'";
        ResultSet rs = dbConn.execute(query);
        
        return createUserFromRowset(rs);
    }
    
    public static User lookupByUsernameOrEmail(String userNameOrEmail) {

        DBConnect dbConn = new DBConnect();
        String query = "select * from user where lower(" +
                (userNameOrEmail.indexOf('@') < 0 ? "user_name" : "email") +
                ") like '"+userNameOrEmail.toLowerCase()+"'";
        ResultSet rs = dbConn.execute(query);
        
        return createUserFromRowset(rs);
    }
    

    public static void updateUserToken(String userName, String token) {
        String query = "update user set token='"+token+"' where lower(user_name) like '" + userName.toLowerCase().trim() + "'";
        new DBConnect().executeUpdate(query);
    }


    public static void clearTokenByUsernameAndToken(String userName, String token) {
        String query = "update user set token='' where lower(user_name) like '" + 
                userName.toLowerCase().trim() + "' and token like '" + token + "'";
        new DBConnect().executeUpdate(query);
    }
    
    
    public static boolean isExistingUser(String userName) throws SQLException {
        DBConnect dbConn = new DBConnect();
        ResultSet rs = dbConn.execute("select user_name from user where lower(user_name) like '" + userName.toLowerCase() + "'");
        
        return (rs != null && rs.first());
    }
    
    
    public static boolean isExistingEmail(String email) throws SQLException {
        DBConnect dbConn = new DBConnect();
        ResultSet rs = dbConn.execute("select email from user where lower(email) like '" + email.toLowerCase() + "'");
        
        return (rs != null && rs.first());
    }
    

    public static ArrayList<Integer> getProblemIdsFromGradeCategorySample(int grade, int category, boolean sample) {
        DBConnect dbConn = new DBConnect();
        
        String query = "select pid from prob_g" + grade +" where category=" + category; 
        if (sample) {
            query += " and sample is true";
        }
        
        ResultSet rs = dbConn.execute(query);
        ArrayList<Integer> pidList = null;
        
        if (rs != null) {
            pidList = new ArrayList<Integer>();
            try {
                while (rs.next()) {
                    pidList.add(rs.getInt("pid"));
                }
            }
            catch (SQLException sqlex) {
            }
        }       

        return pidList;
    }
    

    public static ArrayList<Hint> getHintFromHidLlist(String hids) {
        ArrayList<Hint> hintList = null;

        if (hids != null && !hids.trim().isEmpty()) {
            String query = "select hid, description from hint where hid in (" + hids + ")";
            ResultSet rsHint = new DBConnect().execute(query);

            if (rsHint != null) {
                hintList = new ArrayList<Hint>();
                try {
                    while (rsHint.next()) {
                        Hint hint = new Hint();
                        hint.hid = rsHint.getInt("hid");
                        hint.desc = rsHint.getString("description");
                        hintList.add(hint);
                    }
                }
                catch (SQLException sqlex) {
                }
            }
        }

        return hintList;
    }
    
    public static Prob getProbFromGradePid(int grade, int pid) {
        DBConnect dbConn = new DBConnect();
        ResultSet rs = dbConn.execute("select pid, type, problem, param, answer, hint from prob_g" + grade +" where pid=" + pid);
        
        if (rs == null) {
            return null;
        }

        Prob prob = null;
        try {
            while (rs.next()) {
                prob = new Prob();
                
                HashMap<String,String> paramMap = Utils.parseParamMap(rs.getString("param"));
                
                prob.pid = rs.getInt("pid");
                prob.problem = Utils.replaceParameter(rs.getString("problem"), paramMap);
                prob.type = rs.getInt("type");
                prob.answer = rs.getString("answer");
                if (prob.answer == null || prob.answer.isEmpty()) {
                    prob.answer = "<ans>";
                }
                
                /*String[] ans = Utils.replaceParameter(prob.answer, paramMap).split("$$");
                for (int i=0; i<ans.length; i++) {
                    try {
                        ans[i] = JEval.getEngine().eval(ans[i]).toString();
                    }
                    catch (ScriptException je) {
                    }
                    if (i != 0) {
                        prob.answer += " $$ ";
                    }
                    prob.answer = ans[i];
                }*/
                prob.answer = Utils.replaceParameter(prob.answer, paramMap);
                        
                        
                prob.hintList = getHintFromHidLlist(rs.getString("hint"));
                if (!Utils.isEmpty(prob.hintList)) {
                    for (Hint hint : prob.hintList) {
                        hint.desc = Utils.replaceParameter(hint.desc, paramMap);
                    }
                }
                break;
            }
        }
        catch (SQLException sqlex) {
        }
        
        return prob;
    }
    
    
    private static User createUserFromRowset(ResultSet rs) {
        User user = null;
        
        try {
            if (rs != null && rs.first()) {
                user = new User();
                user.userName = rs.getString("user_name");
                user.firstName = rs.getString("first_name");
                user.lastName = rs.getString("last_name");
                Blob pictureBlob = rs.getBlob("picture");
                if (pictureBlob != null) {
                    user.picture = pictureBlob.getBytes(0, (int)pictureBlob.length());
                }
                user.email = rs.getString("email");
                user.salt = rs.getString("salt");
                user.password = rs.getString("password");
                user.paidUser = rs.getBoolean("paid");
                user.paymentExpiration = rs.getDate("paid_expiration");
                user.token = rs.getString("token");
            }
        }
        catch (SQLException se) {
        }

        return user;
    }

    ////////////////
    // internal use
    ////////////////
    public static Prob getNextProbFromGradePid(int grade, int pid, String action) {
        DBConnect dbConn = new DBConnect();
        
        String queryStr = "select pid, type, problem, param, answer, hint from prob_g" + grade +" where pid";
        if ("prev".equals(action)) {
        	queryStr += "<" + pid  + " order by pid desc limit 1";
        }
        else {
        	if ("next".equals(action)) action = ">"; else action = ">=";
        	queryStr += action + pid  + " order by pid limit 1";
        }
        
        ResultSet rs = dbConn.execute(queryStr);
        
        if (rs == null) {
            return null;
        }

        Prob prob = null;
        try {
            while (rs.next()) {
                prob = new Prob();
                
                prob.pid = rs.getInt("pid");
                prob.problem = rs.getString("problem");
                prob.param = rs.getString("param");
                prob.type = rs.getInt("type");
                prob.answer = rs.getString("answer");
                
                /*String[] ans = Utils.replaceParameter(prob.answer, paramMap).split("$$");
                for (int i=0; i<ans.length; i++) {
                    try {
                        ans[i] = JEval.getEngine().eval(ans[i]).toString();
                    }
                    catch (ScriptException je) {
                    }
                    if (i != 0) {
                        prob.answer += " $$ ";
                    }
                    prob.answer = ans[i];
                }*/
                        
                prob.hintList = getHintFromHidLlist(rs.getString("hint"));
                if (!Utils.isEmpty(prob.hintList)) {
                    for (Hint hint : prob.hintList) {
                        hint.desc = hint.desc;
                    }
                }
                break;
            }
        }
        catch (SQLException sqlex) {
        }
        
        return prob;
    }
    
    

}
