package com.oemath.resource;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class DBConnect {
    
    private Connection conn;
    
    private Statement stat;
    
    private String errMessage;
    
    public DBConnect() {
        try {
            Class.forName("com.mysql.jdbc.Driver");
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/oemath", "root", "");
            stat = conn.createStatement();
        }
        catch (Exception ex) {
            errMessage = ex.getMessage();
        }
    }
    
    public ResultSet execute(String query) {
        ResultSet rs = null;
        
        try {
            rs = stat.executeQuery(query);
        }
        catch (Exception ex) {
            errMessage = ex.getMessage();
        }
        
        return rs;
    }
    
    public ResultSet executeUpdate(String query) {
        ResultSet rs = null;
        
        try {
            stat.executeUpdate(query);
        }
        catch (Exception ex) {
            errMessage = ex.getMessage();
        }
        
        return rs;
    }
    
    public PreparedStatement prepareStatement(String query) {
        try {
            return conn.prepareStatement(query);
        }
        catch (SQLException se) {
            return null;
        }
    }

    public String getLastError() {
        return errMessage;
    }
}
