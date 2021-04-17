# CURRENTLY NOT NEEDED

# from datetime import date

# def get_current_season():
#     """
#     Returns the current season based on the date.
#     Seasons start around September or October and end in May or June.
#     Seasons are identified by the year they start in.
#     So, if it's September or later, return the current year as the season.
#     If it's before September, we're still in the season identified by the previous year.
#     """
#     today = date.today()
#     year = today.year
#     month = today.month
#     if month > 8:
#         return year
#     else:
#         return year-1